export const EXERCISE_GROUPS = [
  {
    id: 'intervals',
    title: 'Intervals',
    description: 'Compare intervals and identify the distances between notes.',
    to: '/exercises/intervals',
    exercises: [
      {
        title: 'Interval Comparison',
        description: 'Hear two intervals and say which is wider, or whether they match. No note names, nothing to read.',
        to: '/exercises/interval-comparison',
      },
      {
        title: 'Interval Identification',
        description: 'Hear one interval and name it, from perfect 4ths and 5ths up to compound intervals.',
        to: '/exercises/interval-identification',
      },
      {
        title: 'Multi-Note Interval Identification',
        description: 'Hear a stack of three to five notes and name every note’s interval above the lowest.',
        to: '/exercises/multi-interval-identification',
      },
    ],
  },
  {
    id: 'chords',
    title: 'Chords',
    description: 'Recognise chord qualities, from triads to seventh chords.',
    to: '/exercises/chords',
    exercises: [
      {
        title: 'Chord Identification',
        description: 'Hear one chord and name its quality, from major and minor up to seventh chords.',
        to: '/exercises/chord-identification',
      },
    ],
  },
  {
    id: 'rhythm',
    title: 'Rhythm',
    description: 'Practise pulse, rhythm patterns, metre and timing.',
    to: '/exercises/rhythm',
    exercises: [
      {
        title: 'Pulse Tapping',
        description: 'Tap a steady pulse, then explore compound grouping, skipped beats and displaced clicks.',
        to: '/exercises/pulse-tapping',
      },
      { title: 'Rhythm Tap-back', description: 'Hear a short rhythm and tap it back at the same tempo.', to: '/exercises/rhythm-tap-back' },
      { title: 'Rhythm Recognition', description: 'Match a heard rhythm to its written pattern.', to: '/exercises/rhythm-recognition' },
      { title: 'Metre Identification', description: 'Identify the metre from accented beat groups.', to: '/exercises/metre-identification' },
      { title: 'Rhythm Reading', description: 'Read a short score and tap its rhythm.', to: '/exercises/rhythm-reading' },
      { title: 'Rhythm Error Detection', description: 'Compare related rhythms by ear or against a score.', to: '/exercises/rhythm-error-detection' },
      { title: 'Silent-bar Timing', description: 'Keep the pulse when the metronome falls silent.', to: '/exercises/silent-bar-timing' },
    ],
  },
] as const;

export type ExerciseGroupId = typeof EXERCISE_GROUPS[number]['id'];
