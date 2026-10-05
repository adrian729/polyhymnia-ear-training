import { createCatalog, createResultStore, type HelpSection, type OverviewSection, type QuestionCount } from '../shared';

export const EXERCISE_TITLE = 'Match a note';
export interface PitchExerciseOptions { questionCount: QuestionCount; autoNext: boolean; cents: number; seconds: number }
export const DEFAULT_OPTIONS: PitchExerciseOptions = { questionCount: 5, autoNext: false, cents: 50, seconds: .5 };
export const OVERVIEW_HELP: readonly OverviewSection[] = [{
  heading: 'Sing the reference', intro: 'Listen to one note, then sing or hum it in the same octave.',
  items: [
    { term: 'A correct answer', text: 'Hold a clear, steady pitch within the lesson’s tolerance for the full hold duration. Live feedback helps you adjust. There is no time limit; replay starts a fresh hold. Skip counts as wrong.' },
    { term: 'Passing', text: 'Complete all five notes. At least four correct matches (80%) pass a lesson. Your best score and passed status are saved on this device. Custom sessions show a score without updating lessons.' },
    { term: 'Your range', text: 'Set a voice preset and your own note limits in Pitch settings. Every target uses your selected range. Presets and microphone sensitivity are saved, but microphone activation is always explicit.' },
    { term: 'Microphone', text: 'Enable it in Pitch settings before starting. Use headphones, one voice and one note at a time. Sing only after the reference finishes. Reference audio cannot count as your answer; microphone interruptions do not count as wrong answers.' },
  ],
}];
export const MODULES = [{ id: 'single-note', title: 'Single-note matching', help: [
  { heading: 'Match and sustain', text: 'Start with a half-second match, then hold the same pitch for a full second. Each question chooses a note from your vocal range.' },
] as readonly HelpSection[] }];
export const LESSONS = [
  { id: 'match-half-second', moduleId: 'single-note', title: 'Match a note · ½ second', options: DEFAULT_OPTIONS },
  { id: 'hold-one-second', moduleId: 'single-note', title: 'Hold a note · 1 second', options: { ...DEFAULT_OPTIONS, seconds: 1 } },
];
export const { lessonById, lessonsForModule } = createCatalog(MODULES, LESSONS);
export const { getLessonResult, recordLessonResult } = createResultStore('polyhymnia:pitch-matching:results:v1');
