import { EXERCISES } from './navigation';

// Groups curate links; an exercise can appear in any number of groups or other pages.
export const EXERCISE_GROUPS = [
  {
    id: 'intervals',
    title: 'Intervals',
    description: 'Compare intervals and identify the distances between notes.',
    to: '/exercises/intervals',
    exercises: [
      EXERCISES['interval-comparison'],
      EXERCISES['interval-identification'],
      EXERCISES['multi-interval-identification'],
    ],
  },
  {
    id: 'chords',
    title: 'Chords',
    description: 'Recognise chord qualities, from triads to seventh chords.',
    to: '/exercises/chords',
    exercises: [
      EXERCISES['chord-identification'],
    ],
  },
  {
    id: 'rhythm',
    title: 'Rhythm',
    description: 'Practise pulse, rhythm patterns, metre and timing.',
    to: '/exercises/rhythm',
    exercises: [
      EXERCISES['pulse-tapping'],
      EXERCISES['rhythm-tap-back'],
      EXERCISES['rhythm-recognition'],
      EXERCISES['metre-identification'],
      EXERCISES['rhythm-reading'],
      EXERCISES['rhythm-error-detection'],
      EXERCISES['silent-bar-timing'],
    ],
  },
  {
    id: 'pitch',
    title: 'Pitch',
    description: 'Match a reference note with your voice and see live pitch feedback.',
    to: '/exercises/pitch',
    exercises: [
      EXERCISES['pitch-matching'],
    ],
  },
] as const;

export type ExerciseGroup = typeof EXERCISE_GROUPS[number];
export type ExerciseGroupId = ExerciseGroup['id'];
