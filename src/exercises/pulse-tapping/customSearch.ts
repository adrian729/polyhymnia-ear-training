import { listParam } from '../shared/customSearch';
import { DEFAULT_OPTIONS, type CustomExerciseOptions, type ExerciseOptions } from './options';
export interface CustomSearch {
  minBpm: number; maxBpm: number; metres: string; bars: ExerciseOptions['bars']; count: ExerciseOptions['count'];
  variants: string; guided: boolean; subdivisions: boolean; beats: string;
}
export function parseCustomSearch(raw: Record<string, unknown>): CustomSearch {
  const numeric = (key: string, fallback: number) => raw[key] === undefined ? fallback : Number(raw[key]);
  // Existing fixed-tempo URLs/settings remain fixed when opened with range controls.
  const legacyBpm = raw.bpm === undefined ? undefined : Number(raw.bpm);
  return { minBpm: numeric('minBpm', legacyBpm ?? DEFAULT_OPTIONS.minBpm), maxBpm: numeric('maxBpm', legacyBpm ?? DEFAULT_OPTIONS.maxBpm),
    metres: listParam(raw.metres ?? raw.metre, [DEFAULT_OPTIONS.metre]),
    bars: numeric('bars', DEFAULT_OPTIONS.bars) as CustomSearch['bars'],
    count: raw.count === 'endless' ? 'endless' : numeric('count', DEFAULT_OPTIONS.count as number),
    variants: listParam(raw.variants ?? raw.variant, [DEFAULT_OPTIONS.variant]),
    guided: raw.guided === undefined ? true : raw.guided === true || raw.guided === 'true',
    subdivisions: raw.subdivisions === true || raw.subdivisions === 'true',
    beats: typeof raw.beats === 'string' ? raw.beats : '1,3' };
}
export function optionsFromSearch(search: CustomSearch): CustomExerciseOptions {
  const { beats, metres, variants, ...rest } = search;
  return { ...rest, metres: [...new Set(metres.split(',').filter(Boolean))] as CustomExerciseOptions['metres'],
    variants: [...new Set(variants.split(',').filter(Boolean))] as CustomExerciseOptions['variants'],
    targetBeats: beats.split(',').filter(Boolean).map(Number) };
}
