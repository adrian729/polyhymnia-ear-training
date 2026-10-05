import { buildPulsePlan, selectPulseBpm } from '@polyhymnia/rhythm';
import { beatsPerBar, validateExerciseOptions, VARIANT_METRES, type ExerciseOptions, type PulseExerciseOptions } from './options';

/** Resolve a custom selection once per attempt; the plan and displayed task share it. */
export function generatePulseAttempt(options: PulseExerciseOptions, previousBpm?: number, random: () => number = Math.random) {
  const errors = validateExerciseOptions(options);
  if (errors.length) throw new RangeError(errors.join(' '));
  let selected: ExerciseOptions;
  if ('variants' in options) {
    const { variants, metres, ...rest } = options;
    const variant = variants[Math.floor(random() * variants.length)]!;
    const compatible = metres.filter(metre => VARIANT_METRES[variant].includes(metre));
    const metre = compatible[Math.floor(random() * compatible.length)]!;
    selected = { ...rest, variant, metre };
  } else selected = options;
  return { options: selected, plan: generatePulse(selected, previousBpm, random) };
}

export function generatePulse(options: ExerciseOptions, previousBpm?: number, random?: () => number) {
  const errors = validateExerciseOptions(options);
  if (errors.length) throw new RangeError(errors.join(' '));
  return buildPulsePlan({ pulseBpm: selectPulseBpm(options.minBpm, options.maxBpm, previousBpm, random), beatsPerBar: beatsPerBar(options.metre), responseBars: options.bars,
    countInBars: 1, minimumCountInSeconds: 0.6,
    targetBeats: options.variant === 'skip' ? options.targetBeats : undefined,
    cueOffsets: options.variant === 'backbeat' ? [1, 3] : options.variant === 'offbeat' ? [0.5, 1.5, 2.5, 3.5] : undefined,
    countInSubdivisions: options.variant === 'compound' ? 3 : 1,
    responseSubdivisions: options.variant === 'compound' && options.subdivisions ? 3 : 1 });
}
