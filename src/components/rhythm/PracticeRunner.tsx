import { useCallback, useRef, useState } from 'react';
import type { NoteEvent } from '@polyhymnia/web-audio';
import type { Playback } from '@polyhymnia/web-audio/webaudio';
import type { TimingAnalysis, PulseMetadata } from '@polyhymnia/rhythm';
import type { LessonRunnerProps } from '@/components/lesson/LessonRoutePage';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import { CATALOG, resultKey, resultStore, type PracticeOptions } from '@/exercises/rhythm-practice/catalog';
import { comparisonTiming, generateAttempt, generateQuestion, choiceEvents, metreEvents, questionEvents, type PracticeQuestion, type PracticeAttempt } from '@/exercises/rhythm-practice/generator';
import { beatsPerBar } from '@/exercises/pulse-tapping/options';
import { sessionAccuracy } from '@/exercises/shared/rhythm/session';
import { recordTimingSession } from '@/exercises/shared/rhythm/store';
import { createPracticeSound } from '@/lib/rhythmSound';
import type { Sound } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { TimedPracticeRunner } from './TimedPracticeRunner';
import { PulseScore } from './PulseScore';
import { PatternReplay, PatternScore } from './PatternScore';
import { PlaybackCue, type PlaybackSegment } from './PlaybackCue';

interface PracticePlayback { question: PracticeQuestion; handle: Playback; segments: readonly PlaybackSegment[] }
function playbackSegments(question: PracticeQuestion, events: readonly NoteEvent[]): PlaybackSegment[] {
  const paired = events.some(e => e.midi === 60) && events.some(e => e.midi === 61);
  if (paired) {
    const heard = question.variant.comparison === 'heard';
    const timing = comparisonTiming(question, heard ? question.pattern.bars.length : 1);
    return [
      { start: timing.aStart, end: timing.aEnd, phase: 'a', label: heard ? 'Rhythm A' : 'A — Written rhythm', letter: 'A' },
      { start: timing.aEnd, end: timing.bStart, phase: 'gap', label: 'Pause — B next' },
      { start: timing.bStart, end: timing.bEnd, phase: 'b', label: heard ? 'Rhythm B' : 'B — Performed rhythm', letter: 'B' },
    ];
  }
  const end = Math.max(...events.map(e => e.start + e.duration));
  if (question.variant.comparison === 'score') {
    const bar = beatsPerBar(question.metre) * 60 / question.bpm;
    return question.pattern.bars.map((_, index) => ({ start: index * bar, end: (index + 1) * bar,
      phase: `bar-${index + 1}`, label: `Performed rhythm · Bar ${index + 1}` }));
  }
  return [{ start: 0, end, phase: 'listening', label: 'Listening…' }];
}
function QuestionCue({ question, playback, segments }: { question: PracticeQuestion; playback?: PracticePlayback; segments: readonly PlaybackSegment[] }) {
  return <PlaybackCue playback={playback?.question === question ? playback.handle : undefined} segments={segments}
    idleLabel={question.variant.comparison === 'heard' ? 'Listen to A, then B.' : 'Listen to the rhythm.'} />;
}

function answerLabel(question: PracticeQuestion, answer: string): string {
  return question.variant.comparison === 'heard' ? answer === 'same' ? 'Same' : 'Different' :
    question.variant.comparison === 'score' ? `Bar ${answer}` : question.choices.length ? `Pattern ${answer}` : answer;
}
function prompt(question: PracticeQuestion): string {
  return question.choices.length ? 'Which written rhythm matches what you heard?' : question.variant.comparison === 'heard' ? 'Are the two rhythms the same or different?' :
    question.variant.comparison === 'score' ? 'Exactly one bar differs from the score. Which bar?' : 'Which metre do the accented groups suggest?';
}
const isCorrect = (question: PracticeQuestion, answer: string) => question.correct === answer;
function keys(question: PracticeQuestion) {
  return Object.fromEntries(question.answers.map((answer, i) => [question.variant.comparison === 'heard' ? answer[0]! : String(i + 1), answer]));
}
function Reveal({ question, playback }: { question: PracticeQuestion; playback?: PracticePlayback }) {
  return <div className="flex w-full min-w-0 flex-col gap-base">
    {playback?.question === question && <QuestionCue question={question} playback={playback} segments={playback.segments} />}
    {question.alternative ? <>
      <PatternReplay pattern={question.pattern} bpm={question.bpm} label={question.variant.comparison === 'heard' ? 'Hear rhythm A' : 'Hear written rhythm'} highlightIds={question.originalChangedIds} />
      <PatternReplay pattern={question.alternative} bpm={question.bpm} label={question.variant.comparison === 'heard' ? 'Hear rhythm B' : 'Hear performed rhythm'} highlightIds={question.changedIds} voice="b" />
    </> : <PatternReplay pattern={question.pattern} bpm={question.bpm} label={question.choices.length ? 'Hear correct rhythm' : 'Hear beat grouping'} events={question.choices.length ? undefined : metreEvents(question.metre, question.bpm)} />}
  </div>;
}
function Answers({ question, selected, answered, disabled, answer, hear, kind, playback, buildChoiceEvents }: AnswerRenderProps<PracticeQuestion, string> & {
  kind: PracticeOptions['kind']; playback?: PracticePlayback; buildChoiceEvents: (question: PracticeQuestion, choice: string) => NoteEvent[];
}) {
  const current = playback?.question === question ? playback : undefined;
  return <div className="flex w-full flex-col gap-base">
    <QuestionCue question={question} playback={current} segments={current?.segments ?? playbackSegments(question, questionEvents(question, kind))} />
    {question.variant.comparison === 'score' && <PatternScore pattern={question.pattern} label="Written rhythm to compare" />}
    <div className={cn('mx-auto grid w-full max-w-3xl gap-base', question.answers.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
      {question.answers.map((choice, i) => <button key={choice} type="button" disabled={disabled} aria-label={answered ? `Hear ${answerLabel(question, choice).toLowerCase()}` : answerLabel(question, choice)}
        onClick={() => answered ? hear(buildChoiceEvents(question, choice)) : answer(choice)}
        className={cn('ornament-corners flex min-h-40 min-w-0 flex-col items-center justify-center gap-tight rounded-lg border px-tight py-base', answerTileClass(answerTileState(choice, question.correct, selected, answered)))}>
        {question.choices.length ? <PatternScore pattern={question.choices[i]!} label={answerLabel(question, choice)} /> : <span className="font-display text-title">{answerLabel(question, choice)}</span>}
        <span className="rubricated font-specimen text-meta text-muted-foreground">key {question.variant.comparison === 'heard' ? choice[0]!.toUpperCase() : i + 1}</span>
      </button>)}
    </div>
  </div>;
}
function TimingReview({ attempt, result }: { attempt: PracticeAttempt; result: TimingAnalysis<PulseMetadata> }) {
  if (attempt.question.variant.silentBars) {
    const returning = result.targets[result.targets.length - 1];
    return <p className="text-meta text-muted-foreground">First returning beat: {returning?.errorSeconds === undefined ? 'missed' : `${Math.abs(returning.errorSeconds * 1000).toFixed(0)} ms ${returning.errorSeconds === 0 ? 'on time' : returning.errorSeconds < 0 ? 'early' : 'late'}`}.</p>;
  }
  return <PatternReplay pattern={attempt.question.pattern} bpm={attempt.question.bpm} label="Hear correct rhythm" highlightIds={result.targets.filter(t => t.status !== 'onTime').map(t => t.target.targetId)} />;
}
export function PracticeRunner(props: LessonRunnerProps<PracticeOptions>) {
  const [playback, setPlayback] = useState<PracticePlayback>();
  const questionsForEvents = useRef(new WeakMap<readonly NoteEvent[], PracticeQuestion>());
  const soundFactory = useCallback((): Sound => {
    const sound = createPracticeSound();
    return { ...sound, playEvents(events, lead) {
      const handle = sound.playEvents(events, lead);
      const question = questionsForEvents.current.get(events);
      setPlayback(question ? { question, handle, segments: playbackSegments(question, events) } : undefined);
      return handle;
    } };
  }, []);
  const { options } = props;
  const buildEvents = (question: PracticeQuestion) => {
    const events = questionEvents(question, options.kind);
    questionsForEvents.current.set(events, question); return events;
  };
  const buildChoiceEvents = (question: PracticeQuestion, choice: string) => {
    const events = choiceEvents(question, choice, options.kind);
    questionsForEvents.current.set(events, question); return events;
  };
  const definition = CATALOG[options.kind];
  if (definition.timed) return <TimedPracticeRunner<PracticeOptions, PracticeAttempt> {...props} exerciseTitle={definition.title} count={options.questionCount} generate={generateAttempt}
    task={attempt => attempt.task}
    readyPrompt={() => options.kind === 'rhythm-tap-back' ? 'Ready. Hear the rhythm; after the second count-in, tap it back.' : options.kind === 'rhythm-reading' ? 'Read the rhythm. Start when ready; tap after one bar of count-in.' : 'Ready. Tap after the count-in and keep going through the silent bars.'}
    phasePrompt={(attempt, snapshot) => snapshot.phase === 'listen' ? 'Listen to the rhythm.' : snapshot.phase === 'countIn' ? options.kind === 'rhythm-tap-back' && snapshot.playbackTimeSeconds >= attempt.countInStart ? 'Count-in — get ready to tap it back.' : 'Count-in — listen.' : options.kind === 'silent-bar-timing' ? 'Keep tapping the pulse, including through silence.' : 'Tap the rhythm.'}
    renderGuide={(attempt, snapshot, setup) => {
      const countIn = snapshot.phase === 'countIn';
      const countTime = snapshot.playbackTimeSeconds >= attempt.countInStart ? snapshot.playbackTimeSeconds - attempt.countInStart : snapshot.playbackTimeSeconds;
      return <div className="flex min-h-28 flex-col items-center justify-center gap-tight">
        {options.kind === 'rhythm-reading' && <PatternScore pattern={attempt.question.pattern} />}
        {(countIn || setup && options.kind !== 'rhythm-reading') && <PulseScore plan={attempt.plan} metre={attempt.metre} phase="countIn" playbackTimeSeconds={countTime} playing={countIn} />}
      </div>;
    }}
    renderReview={(attempt, result) => <TimingReview attempt={attempt} result={result} />}
    saveSession={(id, options, preferences, session) => recordTimingSession(resultKey(id, options, preferences), {
      sessionId: session.id, percent: sessionAccuracy(session)!, recordedAt: new Date().toISOString(), method: 'both', offsets: { ...preferences.offsets }, clockSources: session.clockSources,
    })} />;
  return <LessonRunner {...props} exerciseTitle={definition.title} generate={generateQuestion} isCorrect={isCorrect}
    soundFactory={soundFactory} buildEvents={buildEvents} buildChoiceEvents={buildChoiceEvents}
    saveResult={(id, percent, passed) => resultStore.recordLessonResult(resultKey(id, options), percent, passed)}
    prompt={prompt} verdict={({ question, correct }) => `${correct ? 'Correct' : 'Wrong'}: ${answerLabel(question, question.correct)}.`}
    answerKeys={keys} renderAnswers={answers => <Answers {...answers} kind={options.kind} playback={playback} buildChoiceEvents={buildChoiceEvents} />}
    renderReveal={(question, context) => <Reveal question={question} playback={context === 'summary' ? playback : undefined} />} revealPlaceholder={<div className="h-28 w-full" />} />;
}
