import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPitchAnalyzer, type PitchObservation } from '@polyhymnia/audio-analysis';
import { createPitchyDetector } from '@polyhymnia/audio-analysis-pitchy';
import { createPitchMatch, describePitch } from '@/exercises/pitch-matching/match';
import { DEFAULT_PITCH_SETTINGS, generatePitchTarget, readPitchSettings, savePitchSettings, selectVocalRange } from '@/exercises/pitch-matching/settings';

afterEach(() => vi.unstubAllGlobals());

const sampleRate = 48000;
function observations(hz: number, startFrame = 0, seconds = .8) {
  const samples = Float32Array.from({ length: sampleRate * seconds }, (_, i) => .2 * Math.sin(2 * Math.PI * hz * i / sampleRate));
  return createPitchAnalyzer(createPitchyDetector(), sampleRate).push(samples, startFrame);
}

describe('single-note matching', () => {
  it('matches a sustained reference in its actual octave and rejects an octave error', () => {
    const target = observations(220);
    const match = createPitchMatch(57, sampleRate, 0, 'answer');
    expect(target.map(o => match.observe(o, 'answer')).at(-1)?.matched).toBe(true);
    expect(describePitch(target.at(-1)!, 57)).toMatchObject({ note: 'A3' });
    const octave = observations(440);
    const other = createPitchMatch(57, sampleRate, 0, 'answer');
    expect(octave.some(o => other.observe(o, 'answer').matched)).toBe(false);
    expect(describePitch(octave.at(-1)!, 57)?.cents).toBeCloseTo(1200, 0);
  });

  it('excludes reference samples and old answers, and requires a new continuous hold after silence', () => {
    const match = createPitchMatch(57, sampleRate, sampleRate, 'current');
    expect(observations(220).some(o => match.observe(o, 'current').matched)).toBe(false);
    expect(observations(220, sampleRate).some(o => match.observe(o, 'old').matched)).toBe(false);
    const partial = observations(220, sampleRate, .4);
    expect(partial.some(o => match.observe(o, 'current').matched)).toBe(false);
    const silent = createPitchAnalyzer(createPitchyDetector(), sampleRate).push(new Float32Array(4096), sampleRate * 1.4)[0]!;
    expect(match.observe(silent, 'current').seconds).toBe(0);
    expect(observations(220, sampleRate * 1.5, .4).some(o => match.observe(o, 'current').matched)).toBe(false);
    expect(observations(220, sampleRate * 1.9).some(o => match.observe(o, 'current').matched)).toBe(true);
  });

  it('applies a preset, preserves adjusted bounds and sensitivity, and generates only inside the saved range', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) });
    const preset = selectVocalRange({ ...DEFAULT_PITCH_SETTINGS, minimumRms: .04 }, 'baritone');
    expect(preset).toMatchObject({ rangeKind: 'baritone', low: 43, high: 64, minimumRms: .04 });
    const adjusted = { ...preset, low: 45, high: 63 };
    savePitchSettings(adjusted);
    expect(readPitchSettings()).toEqual(adjusted);
    expect(selectVocalRange(adjusted, 'custom')).toMatchObject({ low: 45, high: 63 });
    expect(selectVocalRange(adjusted, 'soprano')).toMatchObject({ low: 60, high: 81 });
    for (let i = 0; i < 50; i++) {
      const note = generatePitchTarget(readPitchSettings(), 50);
      expect(note).toBeGreaterThanOrEqual(45); expect(note).toBeLessThanOrEqual(63); expect(note).not.toBe(50);
    }
    expect(generatePitchTarget({ low: 61, high: 61 }, 61)).toBe(61);
    for (const range of [{ low: 63, high: 45 }, { low: 45.5, high: 63 }, { low: 20, high: 100 }]) {
      savePitchSettings({ ...adjusted, ...range });
      expect(readPitchSettings()).toMatchObject({ low: DEFAULT_PITCH_SETTINGS.low, high: DEFAULT_PITCH_SETTINGS.high });
    }
  });

  it('measures only unique coverage of the accepted hold, clips overshoot and resets interrupted measurements', () => {
    const match = createPitchMatch(57, 1000, 1000, 'current');
    const window = (startFrame: number, endFrame: number, frequencyHz: number, stable = true): PitchObservation => ({
      startFrame, endFrame, validFrames: endFrame - startFrame, frequencyHz, stable,
      status: 'pitched', clarity: 1, rms: .1, peak: .2, clippedFraction: 0,
    });
    // Reference/foreign data, including an invalid foreign window, are excluded.
    expect(match.observe(window(0, 200, 225), 'current').statistics).toBeUndefined();
    expect(match.observe(window(1000, 1200, 225), 'old').seconds).toBe(0);
    match.observe(window(1000, 1200, 215), 'current');
    match.observe(window(900, 1600, 225), 'old');
    match.observe(window(1000, 1400, 225), 'current'); // Duplicate start cannot add coverage.
    match.observe(window(1050, 1300, 218), 'current'); // Only 100 new frames.
    const result = match.observe(window(1200, 1600, 222), 'current'); // Only 200 of its 300 new frames.
    expect(result).toMatchObject({ matched: true, statistics: { seconds: .5, minimumHz: 215, maximumHz: 222, averageHz: 218.4 } });
    const frozen = result.statistics;
    expect(match.observe(window(1400, 1800, 226), 'current').statistics).toEqual(frozen);
    expect(match.observe(window(1800, 2000, 220, false), 'current').statistics).toBeUndefined();
    match.observe(window(2000, 2200, 217), 'current');
    // A gap starts a new hold, even when its duration equals the prior partial hold.
    match.observe(window(2300, 2500, 224), 'current');
    const afterGap = match.observe(window(2400, 2800, 221), 'current');
    expect(afterGap.statistics).toEqual({ seconds: .5, minimumHz: 221, maximumHz: 224, averageHz: 222.2 });
    expect(frozen).toEqual({ seconds: .5, minimumHz: 215, maximumHz: 222, averageHz: 218.4 });
    match.reset();
    expect(match.observe(window(3000, 3200, 219), 'current').statistics).toBeUndefined();
  });
});
