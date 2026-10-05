import type { LessonRunnerProps } from '@/components/lesson/LessonRoutePage';
import { describeTapTask, VARIANT_TITLE, type PulseExerciseOptions } from '@/exercises/pulse-tapping/options';
import { generatePulseAttempt } from '@/exercises/pulse-tapping/generator';
import { sessionAccuracy } from '@/exercises/shared/rhythm/session';
import { policyKey, recordTimingSession } from '@/exercises/shared/rhythm/store';
import { TimedPracticeRunner } from './TimedPracticeRunner';
import { PulseScore } from './PulseScore';

export function TimedLessonRunner(props: LessonRunnerProps<PulseExerciseOptions>) {
  const custom = 'variants' in props.options;
  return <TimedPracticeRunner<PulseExerciseOptions, ReturnType<typeof generatePulseAttempt>> {...props} exerciseTitle="Pulse Tapping" count={props.options.count}
    generate={(options, previous) => generatePulseAttempt(options, previous?.plan.pulseBpm)}
    task={attempt => custom ? `${VARIANT_TITLE[attempt.options.variant]} · ${attempt.options.metre}` : undefined}
    readyPrompt={attempt => custom ? `Ready. Hear one bar of count-in; then ${describeTapTask(attempt.options).replace(/^Tap/, 'tap')}` : 'Ready. Hear one bar of count-in; then start tapping.'}
    phasePrompt={(attempt, snapshot) => snapshot.phase === 'countIn' ? custom ? `Count-in — listen. Next: ${describeTapTask(attempt.options).replace(/^Tap/, 'tap')}` : 'Count-in — listen; start tapping on the next downbeat.' : custom ? describeTapTask(attempt.options) : 'Tap the requested beats.'}
    renderGuide={(attempt, snapshot, setup) => {
      const showCount = snapshot.phase === 'countIn';
      const showResponse = snapshot.phase === 'respond' && attempt.options.guided;
      return <div className="flex h-28 items-center justify-center">{(setup || showCount || showResponse) && <PulseScore plan={attempt.plan} metre={attempt.options.metre}
        playbackTimeSeconds={snapshot.playbackTimeSeconds} playing={showCount || showResponse} phase={setup || showCount ? 'countIn' : 'respond'} />}</div>;
    }}
    saveSession={(id, options, preferences, session) => {
      if ('variant' in options) recordTimingSession(policyKey(id, options, preferences), { sessionId: session.id, percent: sessionAccuracy(session)!, recordedAt: new Date().toISOString(),
        method: 'both', offsets: { ...preferences.offsets }, clockSources: session.clockSources });
    }} />;
}
