import type { Metre } from '../pulse-tapping/options';
import { CATALOG, KINDS, defaults, type Kind, type PracticeOptions } from './catalog';

export interface PracticeSearch { variants: string; metres: string; minBpm: number; maxBpm: number; count: number | 'endless' }
const number = (value: unknown, fallback: number) => value === undefined ? fallback : Number(value);
export const SEARCH_PARSERS = Object.fromEntries(KINDS.map(kind => [kind, (raw: Record<string, unknown>): PracticeSearch => {
  const initial = defaults(kind);
  return { variants: typeof raw.variants === 'string' ? raw.variants : initial.variants.join(','),
    metres: typeof raw.metres === 'string' ? raw.metres : initial.metres.join(','),
    minBpm: number(raw.minBpm, initial.minBpm), maxBpm: number(raw.maxBpm, initial.maxBpm),
    count: raw.count === 'endless' ? 'endless' : number(raw.count, 5) };
}])) as Record<Kind, (raw: Record<string, unknown>) => PracticeSearch>;
export function optionsFromSearch(kind: Kind, search: PracticeSearch): PracticeOptions {
  return { kind, variants: search.variants.split(',').filter(Boolean), metres: search.metres.split(',').filter(Boolean) as Metre[],
    minBpm: search.minBpm, maxBpm: search.maxBpm, questionCount: search.count, autoNext: false };
}
export function availableMetres(kind: Kind): Metre[] { return [...new Set(CATALOG[kind].variants.flatMap(v => [...v.metres]))]; }
