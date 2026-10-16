// Exercise addresses and presentation are independent of the pages that link to them.
function exercise<const Id extends string>(id: Id, title: string, description: string) {
  return { id, title, description, to: `/practice/${id}` as const };
}

export const EXERCISES = {
  'interval-comparison': exercise(
    'interval-comparison',
    'Interval Comparison',
    'Hear two intervals and say which is wider, or whether they match. No note names, nothing to read.',
  ),
  'interval-identification': exercise(
    'interval-identification',
    'Interval Identification',
    'Hear one interval and name it, from perfect 4ths and 5ths up to compound intervals.',
  ),
  'multi-interval-identification': exercise(
    'multi-interval-identification',
    'Multi-Note Interval Identification',
    'Hear a stack of three to five notes and name every note’s interval above the lowest.',
  ),
  'chord-identification': exercise(
    'chord-identification',
    'Chord Identification',
    'Hear one chord and name its quality, from major and minor up to seventh chords.',
  ),
  'pulse-tapping': exercise(
    'pulse-tapping',
    'Pulse Tapping',
    'Tap a steady pulse, then explore compound grouping, skipped beats and displaced clicks.',
  ),
  'rhythm-tap-back': exercise(
    'rhythm-tap-back',
    'Rhythm Tap-back',
    'Hear a short rhythm and tap it back at the same tempo.',
  ),
  'rhythm-recognition': exercise(
    'rhythm-recognition',
    'Rhythm Recognition',
    'Match a heard rhythm to its written pattern.',
  ),
  'metre-identification': exercise(
    'metre-identification',
    'Metre Identification',
    'Identify the metre from accented beat groups.',
  ),
  'rhythm-reading': exercise(
    'rhythm-reading',
    'Rhythm Reading',
    'Read a short score and tap its rhythm.',
  ),
  'rhythm-error-detection': exercise(
    'rhythm-error-detection',
    'Rhythm Error Detection',
    'Compare related rhythms by ear or against a score.',
  ),
  'silent-bar-timing': exercise(
    'silent-bar-timing',
    'Silent-bar Timing',
    'Keep the pulse when the metronome falls silent.',
  ),
  'pitch-matching': exercise(
    'pitch-matching',
    'Match a note',
    'Hear a note, then sing and hold it in the same octave using your microphone.',
  ),
} as const;

export type Exercise = typeof EXERCISES[keyof typeof EXERCISES];

export function exerciseById(id: string): Exercise | undefined {
  return Object.values(EXERCISES).find(exercise => exercise.id === id);
}
