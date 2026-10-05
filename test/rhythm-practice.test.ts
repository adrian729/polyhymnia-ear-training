import { describe, expect, it } from 'vitest';
import { readMnx } from '@polyhymnia/mnx';
import { layoutScore } from '@polyhymnia/notation-engine';
import { analyzeTiming, timingAccuracy, validatePlan } from '@polyhymnia/rhythm';
import { KINDS, lessons } from '@/exercises/rhythm-practice/catalog';
import { attacks, comparisonTiming, generateAttempt, generateQuestion, metreEvents, patternEvents, patternScore, patternSignature, questionEvents, choiceEvents } from '@/exercises/rhythm-practice/generator';

const seeded = (seed = 42) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const end = (events: ReturnType<typeof patternEvents>) => Math.max(...events.map(e => e.start + e.duration));

describe('starter rhythm exercise contracts', () => {
  it('renders the offered scores and keeps recognition choices audibly distinct', () => {
    const random = seeded();
    for (const kind of KINDS) for (const lesson of lessons(kind)) {
      const question = generateQuestion(lesson.options, undefined, random);
      for (const pattern of [question.pattern, ...question.choices, ...(question.alternative ? [question.alternative] : [])]) {
        const read = readMnx(patternScore(pattern));
        expect(read.doc).not.toBeNull();
        const { diagnostics } = layoutScore(read.doc!, 800);
        expect([...read.diagnostics, ...diagnostics].filter(d => d.severity === 'error' || d.code === 'mnx-unsupported')).toEqual([]);
      }
      if (kind === 'rhythm-recognition') {
        expect(new Set(question.choices.map(p => attacks(p).map(a => a.atPulse).join(','))).size).toBe(3);
        expect(patternSignature(question.choices[Number(question.correct) - 1]!)).toBe(patternSignature(question.pattern));
      }
    }
    for (const metre of ['2/4', '3/4', '4/4', '6/8'] as const) expect(end(metreEvents(metre, 80))).toBeCloseTo(9);
  });

  it('derives similar error pairs from one pattern and highlights each score’s own changed beats', () => {
    const random = seeded();
    for (const lesson of lessons('rhythm-error-detection')) {
      const correct = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const q = generateQuestion(lesson.options, undefined, random);
        correct.add(q.correct);
        const altered = q.alternative!;
        const changedBars = q.pattern.bars.flatMap((bar, index) => bar.join('') === altered.bars[index]!.join('') ? [] : [index + 1]);
        expect(changedBars).toEqual(q.changedBar ? [q.changedBar] : []);
        expect(altered.metre).toBe(q.pattern.metre);
        expect(end(patternEvents(altered, q.bpm))).toBeCloseTo(end(patternEvents(q.pattern, q.bpm)));
        const before = new Set(attacks(q.pattern).map(a => a.atPulse));
        const after = new Set(attacks(altered).map(a => a.atPulse));
        const distance = [...before].filter(t => !after.has(t)).length + [...after].filter(t => !before.has(t)).length;
        expect(distance).toBe(q.correct === 'same' ? 0 : q.variant.comparison === 'heard' ? 2 : 1);
        const changedBeats = new Set([...before].filter(t => !after.has(t)).concat([...after].filter(t => !before.has(t))).map(Math.floor));
        // All highlights refer to actual events, even when insertions shift IDs.
        for (const [pattern, ids] of [[q.pattern, q.originalChangedIds], [altered, q.changedIds]] as const) {
          expect(!!ids?.length).toBe(!!q.changedBar);
          for (const id of ids ?? []) {
            const [, bar, event] = id.split('-');
            expect(pattern.bars[Number(bar)]![Number(event)]).toBeDefined();
            expect(Number(bar) + 1).toBe(q.changedBar);
            const position = Number(bar) * 4 + pattern.bars[Number(bar)]!.slice(0, Number(event)).reduce((n, token) => n + (token === 'e' ? 0.5 : 1), 0);
            expect(changedBeats.has(Math.floor(position))).toBe(true);
          }
        }
      }
      expect(correct.size).toBe(2);
    }
  });

  it('separates heard comparisons with silence and distinct voices without changing their attacks', () => {
    const random = seeded();
    const lesson = lessons('rhythm-error-detection')[0]!;
    for (const bpm of [80, 180]) {
      const q = generateQuestion({ ...lesson.options, minBpm: bpm, maxBpm: bpm }, undefined, random);
      const timing = comparisonTiming(q);
      const events = questionEvents(q, 'rhythm-error-detection');
      expect(timing.aStart).toBe(0);
      const a = events.filter(e => e.midi === 60);
      const b = events.filter(e => e.midi === 61);
      expect(a.map(e => (e.start - timing.aStart) * bpm / 60)).toEqual(attacks(q.pattern).map(n => expect.closeTo(n.atPulse, 10)));
      expect(b.map(e => (e.start - timing.bStart) * bpm / 60)).toEqual(attacks(q.alternative!).map(n => expect.closeTo(n.atPulse, 10)));
      expect(end(a)).toBeCloseTo(timing.aEnd);
      expect(end(b)).toBeCloseTo(timing.bEnd);
      expect(timing.bStart - timing.aEnd).toBeGreaterThanOrEqual(1.2 - 1e-9);
      expect(events.some(e => e.start < timing.bStart && e.start + e.duration > timing.aEnd + 1e-9)).toBe(false);
      expect(choiceEvents(q, 'same', 'rhythm-error-detection')).toEqual(events);
    }
  });

  it('plays listening tasks without count-in beats and keeps bar replays clearly separated', () => {
    const random = seeded();
    for (const kind of ['rhythm-recognition', 'rhythm-error-detection'] as const) for (const lesson of lessons(kind)) {
      const q = generateQuestion(lesson.options, undefined, random);
      const events = questionEvents(q, kind);
      expect(events.every(e => e.midi === 60 || e.midi === 61)).toBe(true);
      const performed = q.variant.comparison === 'score';
      const expected = patternEvents(performed ? q.alternative! : q.pattern, q.bpm, 0, performed ? 'b' : 'a');
      expect(events.slice(0, expected.length)).toEqual(expected);
      if (performed) for (const answer of q.answers) {
        const pair = choiceEvents(q, answer, kind);
        const written = pair.filter(e => e.midi === 60);
        const heard = pair.filter(e => e.midi === 61);
        const index = Number(answer) - 1;
        const timing = comparisonTiming(q, 1);
        expect(written).toEqual(patternEvents({ ...q.pattern, bars: [q.pattern.bars[index]!] }, q.bpm));
        expect(heard).toEqual(patternEvents({ ...q.alternative!, bars: [q.alternative!.bars[index]!] }, q.bpm, timing.bStart, 'b'));
        expect(end(written)).toBeCloseTo(timing.aEnd);
        expect(end(heard)).toBeCloseTo(timing.bEnd);
        expect(timing.bStart - timing.aEnd).toBeGreaterThanOrEqual(1.2 - 1e-9);
      }
    }
  });

  it('aligns tap-back models with targets, grades rest gaps, and varies patterns at fixed tempo', () => {
    const random = seeded();
    for (const kind of ['rhythm-tap-back', 'rhythm-reading'] as const) for (const lesson of lessons(kind)) {
      const options = { ...lesson.options, minBpm: 80, maxBpm: 80 };
      const attempt = generateAttempt(options, undefined, random);
      const next = generateAttempt(options, attempt, random);
      expect(patternSignature(next.question.pattern)).not.toBe(patternSignature(attempt.question.pattern));
      const { plan } = attempt;
      expect(() => validatePlan(plan)).not.toThrow();
      const notes = attacks(attempt.question.pattern);
      expect(plan.targets.map(t => (t.atSeconds - plan.responseWindow.startSeconds) / plan.pulseSeconds)).toEqual(notes.map(a => a.atPulse));
      const models = plan.stimulus.filter(c => 'voice' in c);
      expect(models).toHaveLength(kind === 'rhythm-tap-back' ? notes.length : 0);
      if (kind === 'rhythm-tap-back') expect(models.map(c => (c.atSeconds - plan.beatsPerBar * plan.pulseSeconds) / plan.pulseSeconds)).toEqual(notes.map(a => a.atPulse));
      const perfect = plan.targets.map((t, sequence) => ({ atSeconds: t.atSeconds, sequence }));
      expect(timingAccuracy(analyzeTiming(plan, perfect, 0.08))).toBe(100);
      if (lesson.id === 'rests') {
        let position = 0;
        let restPulse = 0;
        for (const token of attempt.question.pattern.bars[0]!) { if (token === 'r') { restPulse = position + 0.5; break; } position += token === 'e' ? 0.5 : 1; }
        const withExtra = analyzeTiming(plan, [...perfect, { sequence: perfect.length, atSeconds: plan.responseWindow.startSeconds + restPulse * plan.pulseSeconds }], 0.08);
        expect(withExtra.extras).toHaveLength(1);
        expect(timingAccuracy(withExtra)).toBeLessThan(100);
      }
    }
  });

  it('grades only silent beats and the first return, retaining the return at fractional tempos', () => {
    const random = seeded();
    for (const lesson of lessons('silent-bar-timing')) for (const bpm of [71, 83, 92, 99]) {
      const { plan, question } = generateAttempt({ ...lesson.options, minBpm: bpm, maxBpm: bpm }, undefined, random);
      expect(plan.targets).toHaveLength(question.variant.silentBars! * plan.beatsPerBar + 1);
      const returning = plan.targets.at(-1)!;
      expect(returning.metadata).toEqual({ bar: 4, beat: 1 });
      expect(plan.stimulus.some(c => Math.abs(c.atSeconds - returning.atSeconds) < 1e-9)).toBe(true);
      expect(plan.stimulus.some(c => c.atSeconds >= plan.responseWindow.startSeconds && c.atSeconds < returning.atSeconds - 1e-9)).toBe(false);
      const taps = plan.beatGrid.filter(b => b.kind === 'respond' && b.atSeconds <= returning.atSeconds).map((b, sequence) => ({ sequence, atSeconds: b.atSeconds + (b.atSeconds === returning.atSeconds ? 0.1 : 0) }));
      const result = analyzeTiming(plan, taps, 0.08);
      expect(result.extras).toHaveLength(0);
      expect(result.onTime).toBe(plan.targets.length - 1);
      expect(result.targets.at(-1)?.errorSeconds).toBeCloseTo(0.1);
    }
  });
});
