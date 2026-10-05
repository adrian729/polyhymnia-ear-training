import { createCatalog } from '../shared/catalog';
import type { HelpSection, OverviewSection } from '../shared';
import { DEFAULT_OPTIONS, describeTask, type ExerciseOptions } from './options';
import { RHYTHM_PASS_PERCENT } from '../shared/rhythm/session';

export const EXERCISE_TITLE = 'Pulse Tapping';
export const TASK_HELP = 'Hear one bar of count-in, then tap the requested beats using Space or the mouse/touch pad.';
export const OVERVIEW_HELP: readonly OverviewSection[] = [{ heading: 'Keep the pulse', intro: TASK_HELP,
  items: [{ term: 'Accuracy', text: `On-time targets divided by targets plus extra taps. An attempt passes at ${RHYTHM_PASS_PERCENT}%. Five completed attempts make a lesson; an average of ${RHYTHM_PASS_PERCENT}% passes.` },
    { term: 'Tempo', text: 'Each lesson has a preset tempo range. The first lessons use 70–100 pulse BPM. Custom exercises can use their own range. Each attempt stays at its chosen tempo; consecutive completed attempts use different tempos.' },
    { term: 'Timing setup', text: 'Choose your tolerance here. Preview the metronome and your tap sound at their own volumes. Space and the pad are both available. Optional per-input adjustments correct a consistent bias; interruptions are not graded.' }] }];
const stages = [
  ['guided', 'Guided pulse', 'Keep a regular pulse with a visual guide.'],
  ['by-ear', 'Pulse by ear', 'Keep the same pulse without response animation.'],
  ['compound', 'Compound pulse', 'Feel two larger beats inside a 6/8 bar, first with a score guide and then by ear.'],
  ['skip', 'Skip beats', 'Keep counting while tapping selected beats.'],
  ['displaced', 'Displaced clicks', 'Hold the main pulse while clicks fall elsewhere.'],
] as const;
export const MODULES = stages.map(([id, title, text]) => ({ id, title, help: [{ heading: title, text }] as readonly HelpSection[] }));
const lesson = (moduleId: string, id: string, title: string, patch: Partial<ExerciseOptions>) => ({
  moduleId, id, title, options: { ...DEFAULT_OPTIONS, ...patch },
});
export const LESSONS = [
  lesson('guided', 'guided-four', 'Four beats with a guide', {}),
  lesson('guided', 'guided-two', 'Two beats with a guide', { metre: '2/4' }),
  lesson('guided', 'guided-three', 'Three beats with a guide', { metre: '3/4' }),
  lesson('by-ear', 'ear-four', 'Four beats by ear', { guided: false }),
  lesson('by-ear', 'ear-two', 'Two beats by ear', { metre: '2/4', guided: false }),
  lesson('by-ear', 'ear-three', 'Three beats by ear', { metre: '3/4', guided: false }),
  lesson('compound', 'compound-guided-aided', 'Two larger beats with a guide and subdivisions', { variant: 'compound', metre: '6/8', subdivisions: true, guided: true, minBpm: 60, maxBpm: 90 }),
  lesson('compound', 'compound-guided-pulse', 'Two larger beats with a guide, subdivisions fade', { variant: 'compound', metre: '6/8', subdivisions: false, guided: true, minBpm: 60, maxBpm: 90 }),
  lesson('compound', 'compound-aided', 'Two larger beats by ear, with subdivisions', { variant: 'compound', metre: '6/8', subdivisions: true, guided: false, minBpm: 60, maxBpm: 90 }),
  lesson('compound', 'compound-pulse', 'Two larger beats by ear, subdivisions fade', { variant: 'compound', metre: '6/8', subdivisions: false, guided: false, minBpm: 60, maxBpm: 90 }),
  lesson('skip', 'skip-one-three', 'Tap beats 1 & 3', { variant: 'skip', guided: false, targetBeats: [1, 3], minBpm: 70, maxBpm: 110 }),
  lesson('skip', 'skip-two-four', 'Tap beats 2 & 4', { variant: 'skip', guided: false, targetBeats: [2, 4], minBpm: 70, maxBpm: 110 }),
  lesson('displaced', 'click-two-four', 'Main pulse over clicks on 2 & 4', { variant: 'backbeat', guided: false, minBpm: 75, maxBpm: 110 }),
  lesson('displaced', 'click-offbeat', 'Main pulse over offbeat clicks', { variant: 'offbeat', guided: false, minBpm: 75, maxBpm: 110 }),
];
const catalog = createCatalog(MODULES, LESSONS);
export const { lessonById, lessonsForModule } = catalog;
export const lessonHelp = (options: ExerciseOptions) => `${TASK_HELP} ${describeTask(options)}`;
