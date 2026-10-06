import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from 'react';
import type { PitchObservation } from '@polyhymnia/audio-analysis';
import { createPitchWorker } from '@polyhymnia/audio-analysis-pitchy/browser';
import { createPlayer, defaultInstrument, type Playback, type Player } from '@polyhymnia/web-audio/webaudio';
import { LessonActions, LessonActionButton, LessonFrame } from '@/components/lesson/LessonFrame';
import { LessonSummary } from '@/components/lesson/LessonSummary';
import type { LessonRunnerProps } from '@/components/lesson/LessonRoutePage';
import { AUTO_NEXT_DELAY_MS, createLessonFlow, finishFlow, passedLesson, progressSegments, recordAnswer, scoreOf } from '@/exercises/shared';
import { recordLessonResult, type PitchExerciseOptions } from '@/exercises/pitch-matching/catalog';
import { Button } from '@/components/ui/button';
import { useExerciseMicrophone } from './MicrophoneProvider';
import { pitchWorkerUrl } from '@/lib/audioInputAssets';
import { createPitchMatch, describePitch, noteName, type PitchHoldStatistics } from '@/exercises/pitch-matching/match';
import { MicrophoneButton } from './MicrophoneControl';
import { PitchSetup } from './PitchSetup';
import { PitchFeedback } from './PitchFeedback';
import { PitchHoldSummary } from './PitchHoldSummary';
import { Sheet } from '@/components/SheetLayout';
import { ExerciseMasthead } from '@/components/lesson/ExerciseMasthead';
import { TitleText } from '@/components/Initial';
import { createSound } from '@/lib/sound';
import { generatePitchTarget, readPitchSettings, savePitchSettings } from '@/exercises/pitch-matching/settings';
import { HelpPopover } from '@/components/custom/CustomParts';
import { cn } from '@/lib/utils';

type Phase = 'ready' | 'reference' | 'answer' | 'answered' | 'summary';

interface Live { reading?: PitchObservation; held: number }

/** The microphone's reading and hold change ~23 times a second; only the meter subscribes to them. */
function createLiveReading() {
  let state: Live = { held: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set(patch: Partial<Live>) {
      if ((Object.keys(patch) as (keyof Live)[]).every(key => state[key] === patch[key])) return;
      state = { ...state, ...patch };
      listeners.forEach(listener => listener());
    },
  };
}
type LiveReading = ReturnType<typeof createLiveReading>;

function LivePitchFeedback({ live, target, showPitch, ...props }: { live: LiveReading; showPitch: boolean }
  & Omit<ComponentProps<typeof PitchFeedback>, 'pitch' | 'status' | 'held'>) {
  const { reading, held } = useSyncExternalStore(live.subscribe, live.get, live.get);
  return <PitchFeedback {...props} target={target} pitch={showPitch && reading ? describePitch(reading, target) : undefined}
    status={reading?.status} held={held} />;
}

export function PitchMatching({ options, title, lessonId, onBack, onNextLesson }: LessonRunnerProps<PitchExerciseOptions>) {
  const [settings, setSettings] = useState(readPitchSettings);
  const [summarySound] = useState(createSound);
  const [target, setTarget] = useState(() => generatePitchTarget(settings));
  const [flow, setFlow] = useState(() => createLessonFlow<number, PitchHoldStatistics | undefined>({ questionCount: options.questionCount, graded: !!lessonId }));
  const flowRef = useRef(flow); flowRef.current = flow;
  const persisted = useRef(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready');
  const [live] = useState(createLiveReading);
  const setReading = (reading: PitchObservation | undefined) => live.set({ reading });
  const setHeld = (held: number) => live.set({ held });
  const referencePlayer = useRef<{ context: AudioContext; player: Player } | undefined>(undefined);
  const answer = useRef<{ generation: string; match: ReturnType<typeof createPitchMatch> } | undefined>(undefined);
  const playback = useRef<Playback | undefined>(undefined);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = useRef<{ dispose: () => void } | undefined>(undefined);
  const nextButton = useRef<HTMLButtonElement>(null);
  const attemptRevision = useRef(0);
  const resetAnswer = () => {
    attemptRevision.current++; answer.current = undefined;
    clearTimeout(settle.current); playback.current?.stop(); playback.current = undefined;
    if (phaseRef.current !== 'summary' && phaseRef.current !== 'answered') { phaseRef.current = 'ready'; setPhase('ready'); }
    setHeld(0);
  };
  const microphone = useExerciseMicrophone(() => { resetAnswer(); run.current?.dispose(); setReading(undefined); setPracticeReady(false); });
  const [practiceReady, setPracticeReady] = useState(!!microphone.resource);
  const targetRef = useRef(target); targetRef.current = target;
  const complete = (correct: boolean, statistics?: PitchHoldStatistics) => {
    if (phaseRef.current !== 'answer' && phaseRef.current !== 'ready') return;
    answer.current = undefined;
    const next = recordAnswer(flowRef.current, targetRef.current, correct ? statistics : undefined, correct);
    flowRef.current = next; setFlow(next);
    phaseRef.current = next.finished ? 'summary' : 'answered'; setPhase(phaseRef.current);
    setAutoPaused(false);
  };
  const completeRef = useRef(complete); completeRef.current = complete;
  const inSummary = phase === 'summary';

  useEffect(() => {
    if (!inSummary || !lessonId || persisted.current) return;
    persisted.current = true;
    recordLessonResult(lessonId, Math.round(scoreOf(flow.answered) * 100), passedLesson(flow));
  }, [inSummary, lessonId, flow]);

  useEffect(() => () => {
    attemptRevision.current++; answer.current = undefined;
    clearTimeout(settle.current); playback.current?.stop(); summarySound.stop();
  }, [summarySound]);

  useEffect(() => {
    const resource = microphone.resource;
    if (!resource || inSummary) return;
    let closed = false;
    let started = false;
    let freshness: ReturnType<typeof setTimeout> | undefined;
    const epochId = crypto.randomUUID();
    // Capture sends audio straight to the pitch worker, so a busy main thread never stalls it.
    const channel = new MessageChannel();
    let worker: ReturnType<typeof createPitchWorker>;
    try {
      worker = createPitchWorker({ epochId, generation: epochId, sampleRate: resource.context.sampleRate,
        workerUrl: pitchWorkerUrl, chunkPort: channel.port2,
        analysisOptions: { minimumRms: settings.minimumRms, minimumClarity: settings.minimumClarity },
        onFault: reason => { if (!closed) microphone.fail(reason); },
        onObservations(batch) {
          if (closed) return;
          for (const observation of batch.observations) {
            // Do not display or grade delayed observations as current voice input.
            if (resource.context.currentTime * resource.context.sampleRate - observation.endFrame > resource.context.sampleRate * .35) {
              answer.current?.match.reset(); setReading(undefined); setHeld(0); continue;
            }
            setReading(observation);
            const current = answer.current;
            if (current && phaseRef.current === 'answer') {
              const result = current.match.observe(observation, current.generation);
              setHeld(result.seconds);
              if (result.matched) completeRef.current(true, result.statistics);
            }
          }
          clearTimeout(freshness);
          freshness = setTimeout(() => { setReading(undefined); answer.current?.match.reset(); if (phaseRef.current !== 'answered') setHeld(0); }, 350);
        },
      });
    } catch (reason) {
      channel.port1.close();
      microphone.fail(reason instanceof Error ? reason.message : 'Unable to start pitch analysis.');
      return;
    }
    const dispose = () => {
      if (closed) return;
      closed = true; clearTimeout(freshness);
      if (!started) { worker.dispose(); channel.port1.close(); return; }
      // cancel() releases the owned stream. A normal handoff instead drains
      // capture, leaving the prepared microphone available for the next consumer.
      // The worker acknowledges the chunks still in flight, so it goes only after the drain.
      const end = Math.ceil(resource.context.currentTime * resource.context.sampleRate);
      resource.captureIdle = resource.session.finish(end, end).finally(() => worker.dispose());
      // A disposal/disable may reject the drain; the session owns fault reporting.
      void resource.captureIdle.catch(() => {});
    };
    const consumer = { dispose }; run.current = consumer;
    void worker.ready.then(async () => {
      await resource.captureIdle;
      if (!closed) {
        resource.session.start({ epochId, chunkPort: channel.port1 });
        started = true;
      }
    }).catch(reason => { if (!closed) microphone.fail(reason instanceof Error ? reason.message : 'Pitch analysis failed.'); });
    return () => { dispose(); if (run.current === consumer) run.current = undefined; };
  }, [microphone.resource, microphone.fail, settings, inSummary]);

  const reference = async () => {
    const resource = microphone.resource;
    if (!resource) return;
    const reviewing = phaseRef.current === 'answered';
    if (reviewing) setAutoPaused(true);
    resetAnswer(); setReading(undefined);
    const token = attemptRevision.current;
    if (!reviewing) { phaseRef.current = 'reference'; setPhase('reference'); }
    try {
      await resource.context.resume();
      if (token !== attemptRevision.current) return;
      // One reference player per audio context, not a new synth for every note.
      if (referencePlayer.current?.context !== resource.context) {
        referencePlayer.current = { context: resource.context, player: createPlayer(resource.context, defaultInstrument(resource.context)) };
      }
      const sound = referencePlayer.current.player.play([{ midi: targetRef.current, start: 0, duration: 1, velocity: .55 }], { lead: .05, durationSeconds: 1.1 });
      playback.current = sound;
      const result = await sound.finished;
      if (token !== attemptRevision.current) return;
      if (result !== 'ended') throw new Error('Reference playback stopped. Play it again.');
      if (reviewing) return;
      // Allow output presentation and a settling interval before taking answer samples.
      const delay = 300 + ((resource.context.baseLatency || 0) + (resource.context.outputLatency || 0)) * 1000;
      settle.current = setTimeout(() => {
        if (token !== attemptRevision.current) return;
        const generation = `${token}:${crypto.randomUUID()}`;
        answer.current = { generation, match: createPitchMatch(targetRef.current, resource.context.sampleRate,
          Math.ceil(resource.context.currentTime * resource.context.sampleRate), generation, options) };
        phaseRef.current = 'answer'; setPhase('answer'); setHeld(0);
      }, delay);
    } catch (reason) { if (token === attemptRevision.current) microphone.fail(reason instanceof Error ? reason.message : 'Unable to play reference.'); }
  };

  const nextQuestion = () => {
    if (phaseRef.current !== 'answered') return;
    resetAnswer(); setReading(undefined);
    setTarget(generatePitchTarget(settings, targetRef.current));
    phaseRef.current = 'ready'; setPhase('ready'); setAutoPaused(false);
  };
  const nextRef = useRef(nextQuestion); nextRef.current = nextQuestion;
  const referenceRef = useRef(reference); referenceRef.current = reference;
  useEffect(() => { if (phase === 'answered') nextButton.current?.focus(); }, [phase]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('button, a, select, input, textarea, [contenteditable], [role="combobox"]')) return;
      if (event.key === ' ' && (phaseRef.current === 'ready' || phaseRef.current === 'answer' || phaseRef.current === 'answered')) {
        event.preventDefault(); void referenceRef.current();
      } else if (event.key === 'Enter' && phaseRef.current === 'answered') {
        event.preventDefault(); nextRef.current();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  const last = flow.answered.at(-1);
  const autoNext = practiceReady && !!microphone.resource && phase === 'answered' && !!last?.correct && options.autoNext && !autoPaused;
  useEffect(() => {
    if (!autoNext) return;
    const timer = setTimeout(() => nextRef.current(), AUTO_NEXT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoNext]);

  useEffect(() => {
    if (phase === 'ready' && practiceReady && microphone.resource) void referenceRef.current();
  }, [phase, practiceReady, microphone.resource, target]);

  if (inSummary) return <LessonSummary exerciseTitle="Match a note" title={title} flow={flow} onBack={onBack} onNextLesson={onNextLesson}
      onRetake={() => {
        resetAnswer(); summarySound.stop(); persisted.current = false; setPracticeReady(!!microphone.resource);
        const next = createLessonFlow<number, PitchHoldStatistics | undefined>({ questionCount: options.questionCount, graded: !!lessonId });
        flowRef.current = next; setFlow(next); setTarget(generatePitchTarget(settings));
        phaseRef.current = 'ready'; setPhase('ready'); setReading(undefined);
      }}
      onReplayQuestion={midi => {
        summarySound.stop();
        summarySound.playEvents([{ midi, start: 0, duration: 1, velocity: .55 }]);
      }}
      renderReveal={midi => <p className="font-mono text-subhead">{noteName(midi)}</p>}
      renderAnswer={item => item.answer && <PitchHoldSummary target={item.question} statistics={item.answer} />}
      revealPlaceholder={<span>Reference note</span>} summaryNote={() => ' · skipped'} />;

  if (!microphone.resource || !practiceReady) return <Sheet size="custom" className="flex flex-col gap-loose px-base py-loose">
    <nav aria-label="Breadcrumb"><ExerciseMasthead /></nav>
    <Button variant="ghost" className="self-start" onClick={onBack}>Back to lessons</Button>
    <header className="flex flex-col gap-tight">
      <h1 aria-label={flow.answered.length ? 'Practice paused' : 'Prepare your microphone'} className="font-display text-title"><TitleText title={flow.answered.length ? 'Practice paused' : 'Prepare your microphone'} /></h1>
      <p className="text-muted-foreground">{title}{flow.answered.length ? ' · Your answers are kept.' : ''}</p>
    </header>
    <PitchSetup value={settings} onChange={value => {
      resetAnswer(); setReading(undefined); savePitchSettings(value); setSettings(value);
      if (phaseRef.current === 'ready' && (value.low !== settings.low || value.high !== settings.high)) setTarget(generatePitchTarget(value));
    }} />
    {!microphone.resource && <p role="status" className="text-meta text-muted-foreground">Enable the microphone in Pitch settings above to continue.</p>}
    <Button className="self-start" disabled={!microphone.resource} onClick={() => setPracticeReady(true)}>
      {flow.answered.length ? 'Resume practice' : 'Start practice'}
    </Button>
  </Sheet>;

  return <LessonFrame exerciseTitle="Match a note" title={title} onBack={onBack}
    progress={flow.endless ? undefined : progressSegments(flow)} currentIndex={phase === 'answered' ? undefined : flow.answered.length}
    onFinish={flow.endless ? () => {
      resetAnswer(); const next = finishFlow(flowRef.current); flowRef.current = next; setFlow(next);
      phaseRef.current = 'summary'; setPhase('summary');
    } : undefined}>
    <p role="status" aria-live="polite" className={cn('mx-auto max-w-[46ch] text-center font-display text-subhead',
      phase === 'answered' ? last?.correct ? 'text-success-strong' : 'text-destructive' : 'text-muted-foreground')}>
      {phase === 'reference' ? 'Listen to the note.' : phase === 'answer' ? 'Sing or hum the same note.'
        : phase === 'answered' ? last?.correct ? 'Correct. You matched the note.' : 'Skipped. This answer counts as wrong.' : 'Ready for the next note.'}
    </p>
    <LivePitchFeedback live={live} target={target} showPitch={phase !== 'reference' && phase !== 'ready'}
      active={phase === 'answer'} matched={phase === 'answered' && !!last?.correct}
      seconds={options.seconds} cents={options.cents} statistics={phase === 'answered' && last?.correct ? last.answer : undefined} />
    <LessonActions>
      <LessonActionButton variant="outline" disabled={phase === 'reference'} onClick={() => void reference()}>Play question</LessonActionButton>
      {phase === 'answered' ? <LessonActionButton ref={nextButton} onClick={nextQuestion}>Next question</LessonActionButton>
        : <LessonActionButton variant="outline" disabled={phase !== 'answer'} onClick={() => complete(false)}>Skip</LessonActionButton>}
      {autoNext && <LessonActionButton variant="outline" onClick={() => setAutoPaused(true)}>Stay</LessonActionButton>}
    </LessonActions>
    <div className="flex flex-wrap items-center justify-between gap-base border-t border-border pt-base">
      <div className="flex items-center gap-tight">
        <p className="font-mono text-meta text-muted-foreground">±{options.cents} cents · {options.seconds} s hold</p>
        <HelpPopover label="About matching a note"><div className="flex flex-col gap-base">
          <p>Listen, then sing or hum the reference in the same octave. Hold within ±{options.cents} cents for {options.seconds} seconds. Use headphones.</p>
          <p>The pitch indicator moves from flat to sharp; the centre is the reference. Your current pitch is shown only during your turn. The hold resets if the pitch moves outside the tolerance or sound becomes unclear.</p>
          <p>After a match, the green band on the pitch guide spans the minimum to maximum pitch of the accepted hold; its marker shows the average, rather than snapping to the reference. The table gives the same measurements in Hz and cents. The average is weighted by time; overlapping analysis windows are counted once and the final window stops at the required duration. These measurements stay in the session summary. No recording is saved.</p>
          <p>There is no time limit. Play question repeats the reference and starts a fresh hold. Skip counts as wrong. Complete every note; 80% passes a lesson. Custom sessions do not update lesson progress.</p>
          <p>Your target range is {noteName(settings.low)}–{noteName(settings.high)}. Change it and microphone sensitivity in Pitch settings before practice. If the microphone stops, practice pauses without counting a wrong answer.</p>
        </div></HelpPopover>
      </div>
      <div data-microphone-control><MicrophoneButton enabled preparing={false} onToggle={microphone.disable} /></div>
    </div>
  </LessonFrame>;
}
