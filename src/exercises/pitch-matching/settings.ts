import { readJson, writeJson } from '@/lib/storage';

// Starting ranges from Yale Library's New Harvard Dictionary of Music table.
// These are editable repertoire conventions, not a classification of the singer.
export const VOCAL_RANGES = [
  { id: 'bass', title: 'Bass', low: 40, high: 60 },
  { id: 'baritone', title: 'Baritone', low: 43, high: 64 },
  { id: 'tenor', title: 'Tenor', low: 47, high: 67 },
  { id: 'alto', title: 'Alto', low: 53, high: 74 },
  { id: 'mezzo-soprano', title: 'Mezzo-soprano', low: 57, high: 77 },
  { id: 'soprano', title: 'Soprano', low: 60, high: 81 },
] as const;
export type VocalRangeKind = typeof VOCAL_RANGES[number]['id'] | 'custom';
// Complete semitone choices inside the analyzer's supported 65–1500 Hz range.
export const VOCAL_NOTES = Array.from({ length: 54 }, (_, i) => 36 + i); // C2–F6
export interface PitchSettings {
  minimumRms: number;
  minimumClarity: number;
  rangeKind: VocalRangeKind;
  low: number;
  high: number;
}
export const DEFAULT_PITCH_SETTINGS: PitchSettings = {
  minimumRms: 0.008, minimumClarity: 0.9, rangeKind: 'custom', low: 48, high: 72,
};
const KEY = 'polyhymnia:pitch:microphone:v1';
const numberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function readPitchSettings(): PitchSettings {
  const raw = readJson(KEY);
  const value = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const validRange = numberIn(value.low, 36, 89) && Number.isInteger(value.low)
    && numberIn(value.high, 36, 89) && Number.isInteger(value.high) && value.low <= value.high;
  return {
    minimumRms: numberIn(value.minimumRms, 0.001, 0.2) ? value.minimumRms : DEFAULT_PITCH_SETTINGS.minimumRms,
    minimumClarity: numberIn(value.minimumClarity, 0.5, 0.99) ? value.minimumClarity : DEFAULT_PITCH_SETTINGS.minimumClarity,
    rangeKind: VOCAL_RANGES.some(range => range.id === value.rangeKind) ? value.rangeKind as VocalRangeKind : 'custom',
    low: validRange ? value.low as number : DEFAULT_PITCH_SETTINGS.low,
    high: validRange ? value.high as number : DEFAULT_PITCH_SETTINGS.high,
  };
}
export function savePitchSettings(value: PitchSettings) { writeJson(KEY, value); }

export function selectVocalRange(value: PitchSettings, rangeKind: VocalRangeKind): PitchSettings {
  const preset = VOCAL_RANGES.find(range => range.id === rangeKind);
  return { ...value, rangeKind, ...(preset ? { low: preset.low, high: preset.high } : {}) };
}

/** Inclusive range, avoiding the previous note when more than one is available. */
export function generatePitchTarget(range: Pick<PitchSettings, 'low' | 'high'>, previous?: number) {
  const notes = VOCAL_NOTES.filter(midi => midi >= range.low && midi <= range.high);
  const choices = notes.length > 1 ? notes.filter(midi => midi !== previous) : notes;
  if (!choices.length) throw new Error('Choose a valid vocal range.');
  return choices[Math.floor(Math.random() * choices.length)]!;
}
