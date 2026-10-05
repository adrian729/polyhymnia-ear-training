import { readJson, writeJson } from '@/lib/storage';
import type { LessonResult } from '../store';
import type { ExerciseOptions } from '../../pulse-tapping/options';
import { RHYTHM_PASS_PERCENT } from './session';

export type Tolerance = 'relaxed' | 'standard' | 'strict' | 'custom';
export type InputMethod = 'keyboard' | 'pointer';
export interface TimingPreferences {
  method: InputMethod;
  tolerance: Tolerance;
  customMs: number;
  offsets: Record<InputMethod, number>;
  volume: number;
  feedbackSound: 'kick' | 'snare' | 'woodblock';
  feedbackVolume: number;
}
export const DEFAULT_TIMING: TimingPreferences = { method: 'keyboard', tolerance: 'standard', customMs: 80,
  offsets: { keyboard: 0, pointer: 0 }, volume: 0.7, feedbackSound: 'woodblock', feedbackVolume: 0.7 };
const PREFS_KEY = 'polyhymnia:rhythm:timing:v1';
const RESULTS_KEY = 'polyhymnia:rhythm:results:v1';
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const numberIn = (value: unknown, low: number, high: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;
export function readTimingPreferences(): TimingPreferences {
  const raw = readJson(PREFS_KEY);
  const value = object(raw) ? raw : {};
  const offsets = object(value.offsets) ? value.offsets : {};
  return { method: value.method === 'pointer' ? 'pointer' : 'keyboard',
    tolerance: typeof value.tolerance === 'string' && ['relaxed', 'standard', 'strict', 'custom'].includes(value.tolerance) ? value.tolerance as Tolerance : 'standard',
    customMs: numberIn(value.customMs, 10, 250) ? value.customMs : 80,
    volume: numberIn(value.volume, 0, 1) ? value.volume : 0.7,
    feedbackSound: value.feedbackSound === 'kick' || value.feedbackSound === 'snare' ? value.feedbackSound : 'woodblock',
    feedbackVolume: numberIn(value.feedbackVolume, 0, 1) ? value.feedbackVolume : 0.7,
    offsets: { keyboard: numberIn(offsets.keyboard, 0, 250) ? offsets.keyboard : 0,
      pointer: numberIn(offsets.pointer, 0, 250) ? offsets.pointer : 0 } };
}
export function saveTimingPreferences(value: TimingPreferences) { writeJson(PREFS_KEY, value); }
export function creditRadiusSeconds(preferences: TimingPreferences, pulseSeconds: number) {
  const radius = preferences.tolerance === 'custom' ? preferences.customMs / 1000 :
    preferences.tolerance === 'relaxed' ? Math.min(0.12, 0.20 * pulseSeconds) :
      preferences.tolerance === 'strict' ? Math.min(0.04, 0.06 * pulseSeconds) : Math.min(0.08, 0.12 * pulseSeconds);
  return Math.min(radius, 0.45 * pulseSeconds);
}
export function policyKey(lessonId: string, options: ExerciseOptions, preferences: TimingPreferences) {
  return JSON.stringify({ version: 2, lessonId, minBpm: options.minBpm, maxBpm: options.maxBpm, metre: options.metre, bars: options.bars,
    count: options.count, variant: options.variant, guided: options.guided,
    subdivisions: options.variant === 'compound' && options.subdivisions,
    targets: options.variant === 'skip' ? [...options.targetBeats].sort() : 'all',
    tolerance: preferences.tolerance, customMs: preferences.tolerance === 'custom' ? preferences.customMs : undefined });
}
export type SessionRecord = {
  sessionId: string;
  percent: number;
  recordedAt: string;
  clockSources: readonly string[];
} & ({ method: InputMethod; offsetMs: number } | { method: 'both'; offsets: Record<InputMethod, number> });
interface Progress { completedSessions: number; lastRecordedSessionId: string; bestResult: SessionRecord }
function validRecord(value: unknown): value is SessionRecord {
  // Historical results retain their original signed-adjustment metadata.
  return object(value) && typeof value.sessionId === 'string' && value.sessionId.length > 0 &&
    numberIn(value.percent, 0, 100) && typeof value.recordedAt === 'string' &&
    Number.isFinite(Date.parse(value.recordedAt)) &&
    (value.method === 'both' ? object(value.offsets) && numberIn(value.offsets.keyboard, -250, 250) && numberIn(value.offsets.pointer, -250, 250)
      : (value.method === 'keyboard' || value.method === 'pointer') && numberIn(value.offsetMs, -250, 250)) &&
    Array.isArray(value.clockSources) && value.clockSources.every(s => typeof s === 'string');
}
function readResults(): Record<string, Progress> {
  const raw = readJson(RESULTS_KEY);
  if (!object(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, Progress] => {
    const value = entry[1];
    return object(value) && Number.isInteger(value.completedSessions) && numberIn(value.completedSessions, 1, Number.MAX_SAFE_INTEGER) &&
      typeof value.lastRecordedSessionId === 'string' && value.lastRecordedSessionId.length > 0 && validRecord(value.bestResult);
  }));
}
export function getTimingLessonResult(key: string): LessonResult | undefined {
  const progress = readResults()[key];
  return progress ? { bestPercent: progress.bestResult.percent, passed: progress.bestResult.percent >= RHYTHM_PASS_PERCENT,
    attempts: progress.completedSessions } : undefined;
}
export function recordTimingSession(key: string, record: SessionRecord): void {
  if (!validRecord(record)) throw new RangeError('Invalid timing result.');
  const results = readResults();
  const previous = results[key];
  if (previous?.lastRecordedSessionId === record.sessionId) return;
  results[key] = { completedSessions: (previous?.completedSessions ?? 0) + 1, lastRecordedSessionId: record.sessionId,
    bestResult: !previous || record.percent > previous.bestResult.percent ? record : previous.bestResult };
  writeJson(RESULTS_KEY, results);
}
