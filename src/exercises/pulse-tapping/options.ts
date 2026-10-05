export const METRES = ['2/4', '3/4', '4/4', '6/8'] as const;
export type Metre = typeof METRES[number];
export const VARIANTS = ['regular', 'compound', 'skip', 'backbeat', 'offbeat'] as const;
export type Variant = typeof VARIANTS[number];
export const VARIANT_TITLE: Record<Variant, string> = {
  regular: 'Regular pulse', compound: 'Compound pulse', skip: 'Skip beats', backbeat: 'Clicks on 2 & 4', offbeat: 'Offbeat clicks',
};
export const VARIANT_METRES: Record<Variant, readonly Metre[]> = {
  regular: ['2/4', '3/4', '4/4'], compound: ['6/8'], skip: ['4/4'], backbeat: ['4/4'], offbeat: ['4/4'],
};
export interface ExerciseOptions {
  minBpm: number;
  maxBpm: number;
  metre: Metre;
  bars: 2 | 4 | 8;
  count: number | 'endless';
  variant: Variant;
  guided: boolean;
  subdivisions: boolean;
  targetBeats: readonly number[];
}
export interface CustomExerciseOptions extends Omit<ExerciseOptions, 'metre' | 'variant'> {
  metres: readonly Metre[];
  variants: readonly Variant[];
}
export type PulseExerciseOptions = ExerciseOptions | CustomExerciseOptions;
export const DEFAULT_OPTIONS: ExerciseOptions = {
  minBpm: 70, maxBpm: 100, metre: '4/4', bars: 4, count: 5, variant: 'regular', guided: true, subdivisions: false, targetBeats: [1, 3],
};
export function beatsPerBar(metre: Metre) { return metre === '6/8' ? 2 : Number(metre[0]); }
export function validateExerciseOptions(options: PulseExerciseOptions): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(options.minBpm) || !Number.isInteger(options.maxBpm) || options.minBpm < 40 || options.maxBpm > 180 || options.minBpm > options.maxBpm) errors.push('Choose a tempo range within 40–180 pulse BPM, with minimum no greater than maximum.');
  if (![2, 4, 8].includes(options.bars)) errors.push('Choose 2, 4 or 8 response bars.');
  if (options.count !== 'endless' && (!Number.isInteger(options.count) || options.count < 1 || options.count > 200)) errors.push('Choose 1–200 attempts, or endless.');
  const variants = 'variants' in options ? options.variants : [options.variant];
  const metres = 'metres' in options ? options.metres : [options.metre];
  if (!variants.length || variants.some(variant => !VARIANTS.includes(variant))) errors.push('Choose at least one supported click pattern.');
  if (!metres.length || metres.some(metre => !METRES.includes(metre))) errors.push('Choose at least one supported metre.');
  for (const variant of variants) {
    const compatible = VARIANT_METRES[variant];
    if (compatible && metres.length && !metres.some(metre => compatible.includes(metre))) errors.push(`${VARIANT_TITLE[variant]} needs ${compatible.join(' or ')} selected.`);
  }
  for (const metre of metres) {
    if (METRES.includes(metre) && variants.length && !variants.some(variant => VARIANT_METRES[variant]?.includes(metre))) errors.push(`Choose a click pattern that supports ${metre}.`);
  }
  if (variants.includes('skip') && (!options.targetBeats.length || new Set(options.targetBeats).size !== options.targetBeats.length ||
    options.targetBeats.some(n => !Number.isInteger(n) || n < 1 || n > 4))) errors.push('Choose at least one distinct target beat (1–4).');
  return errors;
}
export function describeTapTask(options: ExerciseOptions): string {
  if (options.variant === 'compound') return 'Tap the two larger beats in 6/8.';
  if (options.variant === 'skip') return `Tap only beats ${options.targetBeats.join(' & ')} in 4/4.`;
  if (options.variant === 'backbeat') return 'Tap all four beats over clicks on 2 & 4.';
  if (options.variant === 'offbeat') return 'Tap all four beats over offbeat clicks.';
  return `Tap every beat in ${options.metre}.`;
}
export function describeTask(options: ExerciseOptions): string {
  if (options.variant === 'compound') return `Tap the two larger beats in each 6/8 bar (ONE-and-a, TWO-and-a). BPM counts dotted-quarter pulses, not all six eighth notes. ${options.guided ? 'Follow the score guide.' : 'Use your ears; the response has no animated score guide.'}`;
  if (options.variant === 'skip') return `Hear all four beats; tap only beats ${options.targetBeats.join(' & ')}. Taps on other beats count as extras.`;
  if (options.variant === 'backbeat') return 'Tap all four main beats. After the count-in, clicks sound only on beats 2 and 4.';
  if (options.variant === 'offbeat') return 'Tap all four main beats. After the count-in, clicks sound halfway between them, on the eighth-note offbeats.';
  return `Tap every beat in ${options.metre}, keeping a steady pulse. ${options.guided ? 'Follow the score guide.' : 'Use your ears; the response has no animated score guide.'}`;
}
