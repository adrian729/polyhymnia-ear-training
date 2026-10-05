import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeTiming } from '@polyhymnia/rhythm';
import { LESSONS, lessonById } from '@/exercises/pulse-tapping/catalog';
import { generatePulse, generatePulseAttempt } from '@/exercises/pulse-tapping/generator';
import { DEFAULT_OPTIONS, validateExerciseOptions } from '@/exercises/pulse-tapping/options';
import { parseCustomSearch, optionsFromSearch } from '@/exercises/pulse-tapping/customSearch';
import { completeTimingAttempt, newTimingSession, sessionAccuracy, sessionComplete } from '@/exercises/shared/rhythm/session';
import { DEFAULT_TIMING, saveTimingPreferences, getTimingLessonResult, policyKey, readTimingPreferences, recordTimingSession } from '@/exercises/shared/rhythm/store';

afterEach(() => vi.unstubAllGlobals());
describe('pulse product contracts', () => {
  it('keeps compound targets, skipped beats and displaced clicks distinct', () => {
    for (const lesson of LESSONS) expect(() => generatePulse(lesson.options)).not.toThrow();
    const compound = generatePulse(lessonById('compound-aided')!.options);
    expect(compound.targets).toHaveLength(8);
    expect(compound.stimulus.some(c => c.level === 'subdivision' && c.atSeconds >= compound.responseWindow.startSeconds)).toBe(true);
    const faded = generatePulse(lessonById('compound-pulse')!.options);
    expect(faded.stimulus.some(c => c.level === 'subdivision' && c.atSeconds >= faded.responseWindow.startSeconds)).toBe(false);
    const skipped = generatePulse(lessonById('skip-two-four')!.options);
    expect([...new Set(skipped.targets.map(t => t.metadata?.beat))]).toEqual([2, 4]);
    const displaced = generatePulse(lessonById('click-offbeat')!.options);
    expect(displaced.targets).toHaveLength(16);
    expect(displaced.stimulus.filter(c => c.atSeconds >= displaced.responseWindow.startSeconds).every(c =>
      displaced.targets.every(t => Math.abs(t.atSeconds - c.atSeconds) > 0.1))).toBe(true);
  });

  it('varies attempt tempo within its range, supports fixed legacy URLs and rejects reversed ranges', () => {
    const first = generatePulse(DEFAULT_OPTIONS, undefined, () => 0);
    const next = generatePulse(DEFAULT_OPTIONS, first.pulseBpm, () => 0);
    expect(first.pulseBpm).toBe(70);
    expect(next.pulseBpm).toBe(71);
    expect(next.pulseSeconds).toBeCloseTo(60 / 71);
    const fixed = optionsFromSearch(parseCustomSearch({ bpm: 90 }));
    expect(fixed).toMatchObject({ minBpm: 90, maxBpm: 90 });
    expect(generatePulseAttempt(fixed, 90).plan.pulseBpm).toBe(90);
    expect(validateExerciseOptions({ ...DEFAULT_OPTIONS, minBpm: 100, maxBpm: 70 })).not.toHaveLength(0);
    expect(policyKey('guided-four', DEFAULT_OPTIONS, DEFAULT_TIMING)).not.toBe(policyKey('guided-four', generatePulseAttempt(fixed).options, DEFAULT_TIMING));
  });

  it('samples selected custom patterns and compatible metres while keeping each displayed task paired with its plan', () => {
    const options = optionsFromSearch(parseCustomSearch({ variants: 'regular,compound,skip', metres: '2/4,3/4,4/4,6/8', subdivisions: true }));
    expect(validateExerciseOptions(options)).toEqual([]);
    const draws = [0, 0.5, 0, 0.5, 0, 0, 0.99, 0, 0];
    const random = () => draws.shift()!;
    const regular = generatePulseAttempt(options, undefined, random);
    expect(regular.options).toMatchObject({ variant: 'regular', metre: '3/4' });
    expect(regular.plan.beatsPerBar).toBe(3);
    const compound = generatePulseAttempt(options, regular.plan.pulseBpm, random);
    expect(compound.options).toMatchObject({ variant: 'compound', metre: '6/8' });
    expect(compound.plan.beatsPerBar).toBe(2);
    expect(compound.plan.stimulus.some(c => c.level === 'subdivision' && c.atSeconds >= compound.plan.responseWindow.startSeconds)).toBe(true);
    const skip = generatePulseAttempt(options, compound.plan.pulseBpm, random);
    expect(skip.options).toMatchObject({ variant: 'skip', metre: '4/4' });
    expect([...new Set(skip.plan.targets.map(t => t.metadata?.beat))]).toEqual([1, 3]);
    expect(skip.plan.pulseBpm).not.toBe(compound.plan.pulseBpm);
  });

  it('retains legacy single selections and rejects empty, unknown or incompatible custom selections', () => {
    const legacy = optionsFromSearch(parseCustomSearch({ variant: 'compound', metre: '6/8', bpm: 90 }));
    expect(legacy).toMatchObject({ variants: ['compound'], metres: ['6/8'], minBpm: 90, maxBpm: 90 });
    expect(generatePulseAttempt(legacy).options).toMatchObject({ variant: 'compound', metre: '6/8' });
    for (const raw of [{ variants: '' }, { metres: '' }, { variants: 'unknown' }, { metres: '7/8' },
      { variants: 'regular,compound', metres: '4/4' }, { variants: 'skip', metres: '3/4,4/4' }]) {
      const invalid = optionsFromSearch(parseCustomSearch(raw));
      expect(validateExerciseOptions(invalid).length).toBeGreaterThan(0);
      expect(() => generatePulseAttempt(invalid)).toThrow(RangeError);
    }
  });

  it('counts retries as new slots, seals exactly N, and bounds endless review while preserving its mean', () => {
    const plan = generatePulse(DEFAULT_OPTIONS);
    const perfect = analyzeTiming(plan, plan.targets.map((t, sequence) => ({ atSeconds: t.atSeconds, sequence })), 0.08);
    const missed = analyzeTiming(plan, [], 0.08);
    let finite = newTimingSession(2, 'finite');
    finite = completeTimingAttempt(finite, { id: 'bad', bpm: plan.pulseBpm, result: missed });
    expect(completeTimingAttempt(finite, { id: 'bad', bpm: plan.pulseBpm, result: missed })).toBe(finite);
    finite = completeTimingAttempt(finite, { id: 'retry', bpm: plan.pulseBpm, result: perfect });
    expect(sessionComplete(finite)).toBe(true);
    expect(sessionAccuracy(finite)).toBe(50);
    expect(completeTimingAttempt(finite, { id: 'ungraded', bpm: plan.pulseBpm, result: perfect })).toBe(finite);
    let endless = newTimingSession('endless', 'endless');
    for (let i = 0; i < 60; i++) endless = completeTimingAttempt(endless, { id: String(i), bpm: plan.pulseBpm, result: i % 2 ? perfect : missed });
    expect(endless.reviews).toHaveLength(50);
    expect(endless.completed).toBe(60);
    expect(sessionAccuracy(endless)).toBe(50);
  });

  it('validates saved settings, keeps policy-specific progress, and saves a worse session once without replacing best metadata', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) });
    values.set('polyhymnia:rhythm:timing:v1', JSON.stringify({ method: 'unknown', tolerance: ['strict'], customMs: -5, offsets: { keyboard: '100', pointer: 120 } }));
    expect(readTimingPreferences()).toMatchObject({ method: 'keyboard', tolerance: 'standard', customMs: 80, offsets: { keyboard: 0, pointer: 120 } });
    values.set('polyhymnia:rhythm:timing:v1', JSON.stringify({ offsets: { keyboard: -25, pointer: 250 } }));
    expect(readTimingPreferences().offsets).toEqual({ keyboard: 0, pointer: 250 });
    const configured = { ...DEFAULT_TIMING, feedbackSound: 'snare' as const, feedbackVolume: 0.4, volume: 0, offsets: { keyboard: 25, pointer: 100 } };
    saveTimingPreferences(configured);
    expect(readTimingPreferences()).toEqual(configured);
    const key = policyKey('guided-four', DEFAULT_OPTIONS, DEFAULT_TIMING);
    const record = { sessionId: 'best', percent: 79.999, recordedAt: new Date().toISOString(), method: 'keyboard' as const, offsetMs: 0, clockSources: ['outputTimestamp'] };
    recordTimingSession(key, record);
    expect(getTimingLessonResult(key)?.passed).toBe(false);
    const worse = { sessionId: 'worse', percent: 50, recordedAt: record.recordedAt, method: 'both' as const, offsets: { keyboard: -25, pointer: 100 }, clockSources: record.clockSources };
    recordTimingSession(key, worse); recordTimingSession(key, worse);
    expect(getTimingLessonResult(key)).toEqual({ bestPercent: 79.999, passed: false, attempts: 2 });
    const saved = JSON.parse(values.get('polyhymnia:rhythm:results:v1')!)[key];
    expect(saved.bestResult.sessionId).toBe('best');
    expect(saved.lastRecordedSessionId).toBe('worse');
    recordTimingSession(key, { ...record, sessionId: 'passing', percent: 80 });
    expect(getTimingLessonResult(key)).toEqual({ bestPercent: 80, passed: true, attempts: 3 });
    expect(policyKey('guided-four', DEFAULT_OPTIONS, { ...DEFAULT_TIMING, offsets: { keyboard: 100, pointer: 0 } })).toBe(key);
    expect(getTimingLessonResult(policyKey('guided-four', DEFAULT_OPTIONS, { ...DEFAULT_TIMING, tolerance: 'relaxed' }))).toBeUndefined();
  });
});
