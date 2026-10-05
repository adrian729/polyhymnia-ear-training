import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { timingAccuracy, type PulseCue, type PulseMetadata, type PulsePlan, type TimingAnalysis } from '@polyhymnia/rhythm';
import { bindTapInput, type AttemptSnapshot } from '@polyhymnia/rhythm/browser';
import { useTimedAttempt } from '@polyhymnia/rhythm-react';
import { LessonFrame, LessonActions, LessonActionButton as Button, LessonSummaryFrame } from '@/components/lesson/LessonFrame';
import { Button as SummaryButton } from '@/components/ui/button';
import { answerTileClass } from '@/components/lesson/answerTiles';
import type { LessonRunnerProps } from '@/components/lesson/LessonRoutePage';
import { createRhythmSound } from '@/lib/rhythmSound';
import { completeTimingAttempt, newTimingSession, RHYTHM_PASS_PERCENT, sessionAccuracy, sessionComplete, type TimingSession } from '@/exercises/shared/rhythm/session';
import { creditRadiusSeconds, readTimingPreferences, type TimingPreferences } from '@/exercises/shared/rhythm/store';
import { TimingFeedback } from './TimingFeedback';
import { TimingSummary } from './TimingSummary';
import { cn } from '@/lib/utils';

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
export interface TimedPracticeProps<O, A extends { plan: PulsePlan }> extends LessonRunnerProps<O> {
  exerciseTitle: string;
  count: number | 'endless';
  generate: (options: O, previous?: A) => A;
  task?: (attempt: A) => string | undefined;
  readyPrompt: (attempt: A) => string;
  phasePrompt: (attempt: A, snapshot: AttemptSnapshot<PulseMetadata>) => string;
  renderGuide: (attempt: A, snapshot: AttemptSnapshot<PulseMetadata>, setup: boolean) => ReactNode;
  renderReview?: (attempt: A, result: TimingAnalysis<PulseMetadata>) => ReactNode;
  saveSession: (lessonId: string, options: O, preferences: TimingPreferences, session: TimingSession) => void;
}
/** Shared timed lesson flow; exercise adapters supply content and pedagogy. */
export function TimedPracticeRunner<O, A extends { plan: PulsePlan }>({ options, title, lessonId, onBack, onNextLesson,
  exerciseTitle, count, generate, task, readyPrompt, phasePrompt, renderGuide, renderReview, saveSession }: TimedPracticeProps<O, A>) {
  const [preferences] = useState(readTimingPreferences);
  const [attempt, setAttempt] = useState(() => generate(options));
  const { plan } = attempt;
  const port = useMemo(() => createRhythmSound(preferences.volume, preferences.feedbackSound, preferences.feedbackVolume), [preferences]);
  const { controller, snapshot } = useTimedAttempt<readonly PulseCue[], PulseMetadata>(port);
  const [session, setSession] = useState(() => newTimingSession(count, makeId()));
  const sessionRef = useRef(session);
  const processed = useRef(new WeakSet<object>());
  const attemptId = useRef('');
  const reviewedAttempts = useRef(new Map<string, A>());
  const [setup, setSetup] = useState(true);
  const [summary, setSummary] = useState(false);
  const [startError, setStartError] = useState<string>();
  const pad = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const [inputFlash, setInputFlash] = useState(false);
  const [inputError, setInputError] = useState<string>();
  const busy = ['preparing', 'countIn', 'listen', 'respond', 'finalizing'].includes(snapshot.phase);
  const done = sessionComplete(session);
  const passed = !!lessonId && done && sessionAccuracy(session)! >= RHYTHM_PASS_PERCENT;
  const attemptComplete = !setup && snapshot.phase === 'completed';
  const attemptPassed = !!snapshot.result && timingAccuracy(snapshot.result) >= RHYTHM_PASS_PERCENT;

  useLayoutEffect(() => {
    if (!pad.current) return;
    const abort = new AbortController();
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    const unbind = bindTapInput({ keyboardTarget: window, pointerTarget: pad.current, method: 'both', captureFromControls: true,
      isActive: () => true, onTap(timestamp, method) {
        controller.recordAdjustedTap(timestamp, preferences.offsets[method]);
        setInputFlash(true);
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => setInputFlash(false), 180);
        void port.feedbackTap(abort.signal).catch(error => {
          if (!abort.signal.aborted) setInputError(error instanceof Error ? error.message : 'Tap sound is unavailable.');
        });
      } });
    return () => { abort.abort(); unbind(); port.stopFeedback(); clearTimeout(flashTimer); };
  }, [controller, port, preferences.offsets, summary, attemptComplete]);

  // The pad remounts for each attempt. Focus it once capture begins, and move
  // focus to Next attempt when it disappears after completion.
  useLayoutEffect(() => { if (busy && !summary) pad.current?.focus({ preventScroll: true }); }, [busy, summary]);
  useLayoutEffect(() => { if (attemptComplete && !summary) nextButton.current?.focus({ preventScroll: true }); }, [attemptComplete, summary]);

  useLayoutEffect(() => {
    const result = snapshot.result;
    if (snapshot.phase !== 'completed' || !result || processed.current.has(result)) return;
    processed.current.add(result);
    const next = completeTimingAttempt(sessionRef.current, { id: attemptId.current, bpm: plan.pulseBpm, result, clockSource: snapshot.clockSource,
      task: task?.(attempt) });
    if (next === sessionRef.current) return;
    sessionRef.current = next;
    reviewedAttempts.current.set(attemptId.current, attempt);
    for (const id of reviewedAttempts.current.keys()) if (!next.reviews.some(r => r.id === id)) reviewedAttempts.current.delete(id);
    // Persist the final completion before opening the end-of-exercise summary.
    if (lessonId && sessionComplete(next)) saveSession(lessonId, options, preferences, next);
    setSession(next);
    if (sessionComplete(next)) setSummary(true);
  }, [snapshot, plan, attempt, task, lessonId, options, preferences, saveSession]);

  const start = () => {
    if (sessionComplete(sessionRef.current) || controller.isCapturing() || controller.getSnapshot().phase === 'preparing') return;
    setStartError(undefined); setSummary(false); setSetup(false);
    setInputFlash(false); setInputError(undefined);
    attemptId.current = makeId();
    pad.current?.focus({ preventScroll: true });
    void controller.start(plan, { offsetMs: preferences.offsets.keyboard,
      offsetRangeMs: [Math.min(...Object.values(preferences.offsets)), Math.max(...Object.values(preferences.offsets))],
      creditRadiusSeconds: Math.min(creditRadiusSeconds(preferences, plan.pulseSeconds), ...plan.targets.map(t => t.associationRadiusSeconds)) })
      .catch(error => { setStartError(error instanceof Error ? error.message : 'Unable to start.'); setSetup(true); });
  };
  const prepareNext = () => {
    controller.cancel('Next attempt ready.');
    setAttempt(generate(options, attempt)); setSetup(true); setStartError(undefined);
    setInputFlash(false); setInputError(undefined);
  };
  const retake = () => {
    controller.cancel('Exercise restarted.');
    const next = newTimingSession(count, makeId());
    setAttempt(generate(options, attempt)); reviewedAttempts.current.clear();
    sessionRef.current = next; setSession(next); setSummary(false); setSetup(true); setStartError(undefined);
    setInputFlash(false); setInputError(undefined);
  };
  const back = () => { controller.cancel('Practice closed.'); onBack(); };
  if (summary) return <LessonSummaryFrame exerciseTitle={exerciseTitle} title={title} completed={done || count === 'endless'}>
    <TimingSummary session={session} graded={!!lessonId} renderReview={renderReview ? review => {
      const saved = reviewedAttempts.current.get(review.id); return saved && renderReview(saved, review.result);
    } : undefined}>
      <div className="flex flex-wrap justify-center gap-3">
      <SummaryButton variant="outline" onClick={back}>Back to lessons</SummaryButton>
      <SummaryButton variant={passed ? 'secondary' : 'default'} onClick={retake}>Retake</SummaryButton>
      {done && onNextLesson && <SummaryButton variant={passed ? 'default' : 'outline'} onClick={onNextLesson}>Next lesson</SummaryButton>}
      </div>
    </TimingSummary>
  </LessonSummaryFrame>;
  const progress = count === 'endless' ? undefined : Array.from({ length: count }, (_, index) => {
    const review = session.reviews[index];
    return review ? review.accuracy >= RHYTHM_PASS_PERCENT ? 'right' as const : 'wrong' as const : 'upcoming' as const;
  });
  return <LessonFrame exerciseTitle={exerciseTitle} title={title} onBack={back}
    onFinish={count === 'endless' ? () => { controller.cancel('Practice finished.'); setSummary(true); } : undefined}
    progress={progress} currentIndex={!done && !attemptComplete ? session.completed : undefined}>
    <>
      <p role="status" aria-live="polite" className={cn('mx-auto max-w-[46ch] text-center font-display text-subhead',
        attemptComplete ? attemptPassed ? 'text-success-strong' : 'text-destructive' : 'text-muted-foreground')}>
        {setup ? readyPrompt(attempt) :
          snapshot.phase === 'preparing' ? 'Preparing audio…' : snapshot.phase === 'finalizing' ? 'Finishing…' :
            snapshot.phase === 'interrupted' ? snapshot.reason : snapshot.phase === 'completed' ? attemptPassed ? 'Passed.' : 'Not passed.' : phasePrompt(attempt, snapshot)}
      </p>
      {!attemptComplete && renderGuide(attempt, snapshot, setup)}
      {!attemptComplete && <button ref={pad} type="button" aria-label="Tap here or press Space on each requested beat"
        data-input-active={inputFlash}
        className={cn('ornament-corners mx-auto flex min-h-40 w-full max-w-xl touch-none select-none flex-col items-center justify-center gap-tight rounded-lg border bg-card px-tight py-base outline-none transition-colors duration-fast ease-out-quart',
          answerTileClass('idle'), inputFlash ? 'border-primary-strong bg-primary text-primary-foreground hover:bg-primary' : 'text-primary-strong')}>
        <span className="font-display text-title leading-none">Tap</span>
        <span className={cn('rubricated font-specimen text-meta', inputFlash ? 'text-primary-foreground' : 'text-muted-foreground')}>key Space</span>
      </button>}
      {inputError && <p role="alert" className="text-meta text-destructive">{inputError}</p>}
      {startError && <p role="alert" className="text-destructive">{startError}</p>}
    </>
    <LessonActions>
      {!busy && <Button ref={nextButton} onClick={attemptComplete ? prepareNext : start}>{setup ? 'Start tapping' : snapshot.phase === 'interrupted' ? 'Try again' : 'Next attempt'}</Button>}
    </LessonActions>
    {attemptComplete && snapshot.result && <><TimingFeedback result={snapshot.result} />{renderReview?.(attempt, snapshot.result)}</>}
  </LessonFrame>;
}
