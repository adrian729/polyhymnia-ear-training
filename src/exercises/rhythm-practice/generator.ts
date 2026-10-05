import type { Event, MnxDocument, Time } from '@polyhymnia/mnx';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { buildPulsePlan, selectPulseBpm, validatePlan, type PulseCue, type PulsePlan } from '@polyhymnia/rhythm';
import { buildMeasureScore, noteEvent } from '@/components/presets/mnxBuild';
import { beatsPerBar, type Metre } from '../pulse-tapping/options';
import { CATALOG, validateOptions, type PracticeOptions, type Variant } from './catalog';

export type Token = 'q' | 'e' | 'r';
export interface Pattern { metre: Metre; bars: readonly (readonly Token[])[] }
export interface PatternAttack { atPulse: number; durationPulse: number; bar: number; beat: number; id: string }
export interface PracticeQuestion {
  variant: Variant; metre: Metre; bpm: number; pattern: Pattern;
  alternative?: Pattern; choices: readonly Pattern[]; answers: readonly string[]; correct: string;
  changedBar?: number; changedIds: readonly string[]; originalChangedIds?: readonly string[];
}
export interface PracticeAttempt {
  plan: PulsePlan; metre: Metre; question: PracticeQuestion; task: string;
  countInStart: number;
}
const units = (token: Token) => token === 'e' ? 1 : 2;
const pick = <T,>(values: readonly T[], random: () => number): T => values[Math.floor(random() * values.length)]!;
export function patternSignature(pattern: Pattern): string { return `${pattern.metre}:${pattern.bars.map(bar => bar.join('')).join('|')}`; }
export function attacks(pattern: Pattern): PatternAttack[] {
  const beatCount = beatsPerBar(pattern.metre);
  return pattern.bars.flatMap((bar, index) => {
    let position = 0;
    return bar.flatMap((token, event) => {
      const atPulse = index * beatCount + position / 2;
      position += units(token);
      return token === 'r' ? [] : [{ atPulse, durationPulse: units(token) / 2, bar: index + 1, beat: atPulse - index * beatCount + 1, id: `rhythm-${index}-${event}` }];
    });
  });
}
export function patternScore(pattern: Pattern): MnxDocument {
  const [count, unit] = pattern.metre.split('/').map(Number);
  const measures = pattern.bars.map((bar, index) => {
    const content: Event[] = bar.map((token, event) => ({
      ...(token === 'r' ? { duration: { base: 'quarter' as const }, rest: {} } : noteEvent('B4', { base: token === 'e' ? 'eighth' : 'quarter', ...(pattern.metre === '6/8' ? { dots: 1 } : {}) })),
      id: `rhythm-${index}-${event}`,
    }));
    return buildMeasureScore('treble', { count: count!, unit: unit as Time['unit'] }, content).parts[0]!.measures[0]!;
  });
  return { mnx: { version: 1 }, global: { measures: measures.map((_, i) => i === 0 ? { time: { count: count!, unit: unit as Time['unit'] } } : {}) },
    parts: [{ measures: measures.map((measure, i) => i === 0 ? measure : { sequences: measure.sequences }) }] };
}
function pool(metre: Metre, rests: boolean): Token[][] {
  let patterns: Token[][] = [[]];
  for (let i = 0; i < beatsPerBar(metre); i++) patterns = patterns.flatMap(bar => (rests ? [['q'], ['e', 'e'], ['r']] : [['q'], ['e', 'e']]).map(beat => [...bar, ...beat] as Token[]));
  return patterns.filter(bar => rests ? bar.includes('r') && bar.some(token => token !== 'r') : bar.includes('e'));
}
function generatePattern(metre: Metre, variant: Variant, random: () => number, previous?: Pattern): Pattern {
  const candidates = pool(metre, variant.vocabulary === 'rests');
  let pattern: Pattern;
  // Exclude the previous bar explicitly so fresh attempts also vary at fixed BPM.
  const first = candidates.filter(bar => previous?.bars[0]?.join('') !== bar.join(''));
  pattern = { metre, bars: Array.from({ length: variant.bars ?? 1 }, (_, i) => pick(i === 0 && first.length ? first : candidates, random)) };
  return pattern;
}
function beats(bar: readonly Token[]): Token[][] {
  const result: Token[][] = [];
  for (let i = 0; i < bar.length; i++) result.push(bar[i] === 'e' ? [bar[i++]!, bar[i]!] : [bar[i]!]);
  return result;
}
function mutate(pattern: Pattern, barIndex: number, changes: number, rests: boolean, random: () => number): Pattern {
  const bar = beats(pattern.bars[barIndex]!);
  const positions = Array.from({ length: bar.length }, (_, i) => i);
  for (let n = 0; n < Math.min(changes, bar.length); n++) {
    const index = pick(positions, random); positions.splice(positions.indexOf(index), 1);
    const token = bar[index]![0];
    bar[index] = token === 'r' ? ['q'] : token === 'e' ? ['q'] : rests && random() < 0.5 ? ['r'] : ['e', 'e'];
  }
  return { ...pattern, bars: pattern.bars.map((original, i) => i === barIndex ? bar.flat() : original) };
}
function changedIds(pattern: Pattern, other: Pattern): string[] {
  // Highlight each score's own events in changed beats, including rests. Event
  // indices can shift after splitting a quarter into two eighths.
  return pattern.bars.flatMap((bar, barIndex) => {
    const ownBeats = beats(bar);
    const otherBeats = beats(other.bars[barIndex]!);
    let eventIndex = 0;
    return ownBeats.flatMap((beat, index) => {
      const ids = beat.map((_, i) => `rhythm-${barIndex}-${eventIndex + i}`);
      eventIndex += beat.length;
      return beat.join('') === otherBeats[index]!.join('') ? [] : ids;
    });
  });
}
export function generateQuestion(options: PracticeOptions, previous?: PracticeQuestion, random: () => number = Math.random): PracticeQuestion {
  const errors = validateOptions(options); if (errors.length) throw new RangeError(errors.join(' '));
  const variant = pick(CATALOG[options.kind].variants.filter(v => options.variants.includes(v.id)), random);
  const metres = options.metres.filter(m => variant.metres.includes(m));
  const metre = pick(metres, random);
  const bpm = selectPulseBpm(options.minBpm, options.maxBpm, previous?.bpm, random);
  if (options.kind === 'metre-identification' || options.kind === 'silent-bar-timing') return { variant, metre, bpm,
    pattern: { metre, bars: [Array.from({ length: beatsPerBar(metre) }, () => 'q' as const)] },
    choices: [], answers: metres, correct: metre, changedIds: [] };
  const pattern = generatePattern(metre, variant, random, previous?.pattern);
  if (options.kind === 'rhythm-recognition') {
    const other = pool(metre, variant.vocabulary === 'rests').filter(bar => bar.join('') !== pattern.bars[0]!.join(''));
    const distractors: Pattern[] = [];
    // Prefer related distractors, all with genuinely different audible attacks.
    other.sort((a, b) => {
      const target = new Set(attacks(pattern).map(a => a.atPulse));
      const distance = (bar: Token[]) => {
        const candidate = new Set(attacks({ metre, bars: [bar] }).map(a => a.atPulse));
        return [...target].filter(t => !candidate.has(t)).length + [...candidate].filter(t => !target.has(t)).length;
      };
      return distance(a) - distance(b);
    });
    while (distractors.length < 2) {
      const window = other.slice(0, variant.id === 'two' ? other.length : Math.min(4, other.length));
      const bar = pick(window, random); other.splice(other.indexOf(bar), 1);
      distractors.push({ metre, bars: [bar] });
    }
    const position = Math.floor(random() * 3);
    const choices = [...distractors]; choices.splice(position, 0, pattern);
    return { variant, metre, bpm, pattern, choices, answers: ['1', '2', '3'], correct: String(position + 1), changedIds: [] };
  }
  if (options.kind === 'rhythm-error-detection') {
    const heard = variant.comparison === 'heard';
    const changedBar = Math.floor(random() * pattern.bars.length);
    // Equal probabilities, without a predictable alternating answer sequence.
    const different = !heard || random() < 0.5;
    const alternative = different ? mutate(pattern, changedBar, heard ? 2 : 1, variant.vocabulary === 'rests', random) : pattern;
    return { variant, metre, bpm, pattern, alternative, choices: [], answers: heard ? ['same', 'different'] : ['1', '2'],
      correct: heard ? different ? 'different' : 'same' : String(changedBar + 1), changedBar: different ? changedBar + 1 : undefined,
      originalChangedIds: changedIds(pattern, alternative), changedIds: changedIds(alternative, pattern) };
  }
  return { variant, metre, bpm, pattern, choices: [], answers: [], correct: '', changedIds: [] };
}
export function patternEvents(pattern: Pattern, bpm: number, start = 0, voice: 'a' | 'b' = 'a'): NoteEvent[] {
  const pulse = 60 / bpm;
  const end = start + pattern.bars.length * beatsPerBar(pattern.metre) * pulse;
  const events = attacks(pattern).map(a => ({ midi: voice === 'b' ? 61 : 60, start: start + a.atPulse * pulse, duration: 0.05, velocity: 0.8 }));
  // Percussion has a fixed short envelope; the declared final duration retains trailing rests.
  if (events.length) events[events.length - 1]!.duration = end - events[events.length - 1]!.start;
  return events;
}
const comparisonGap = (bpm: number) => Math.max(1.2, 2 * 60 / bpm);
/** Audio and the A/B indicator share the complete pattern boundaries, including rests. */
export function comparisonTiming(question: PracticeQuestion, bars = question.pattern.bars.length) {
  const bar = beatsPerBar(question.metre) * 60 / question.bpm;
  const length = bars * bar;
  return { aStart: 0, aEnd: length, bStart: length + comparisonGap(question.bpm),
    bEnd: 2 * length + comparisonGap(question.bpm) };
}
export function metreEvents(metre: Metre, bpm: number): NoteEvent[] {
  const pulse = 60 / bpm;
  const beatCount = beatsPerBar(metre);
  const subdivisions = metre === '6/8' ? 3 : 2;
  return Array.from({ length: 12 * subdivisions }, (_, index) => {
    const beat = Math.floor(index / subdivisions) % beatCount;
    const sub = index % subdivisions;
    return { midi: sub === 0 && beat === 0 ? 84 : 76, start: index * pulse / subdivisions,
      duration: index === 12 * subdivisions - 1 ? pulse / subdivisions : 0.035,
      velocity: sub !== 0 ? 0.2 : beat === 0 ? 0.95 : metre === '4/4' && beat === 2 ? 0.5 : 0.35 };
  });
}
export function questionEvents(question: PracticeQuestion, kind: PracticeOptions['kind']): NoteEvent[] {
  if (kind === 'metre-identification') return metreEvents(question.metre, question.bpm);
  const performed = kind === 'rhythm-error-detection' && question.variant.comparison === 'score';
  const events = patternEvents(performed ? question.alternative! : question.pattern, question.bpm, 0, performed ? 'b' : 'a');
  if (kind === 'rhythm-error-detection' && question.variant.comparison === 'heard') events.push(...patternEvents(question.alternative!, question.bpm, comparisonTiming(question).bStart, 'b'));
  return events;
}
export function choiceEvents(question: PracticeQuestion, choice: string, kind: PracticeOptions['kind']): NoteEvent[] {
  if (kind === 'metre-identification') return metreEvents(choice as Metre, question.bpm);
  if (question.choices.length) return patternEvents(question.choices[Number(choice) - 1]!, question.bpm);
  if (question.variant.comparison === 'heard') return questionEvents(question, kind);
  const index = Number(choice) - 1;
  const written = { ...question.pattern, bars: [question.pattern.bars[index]!] };
  const performed = { ...question.alternative!, bars: [question.alternative!.bars[index]!] };
  return [...patternEvents(written, question.bpm), ...patternEvents(performed, question.bpm, comparisonTiming(question, 1).bStart, 'b')];
}
export function generateAttempt(options: PracticeOptions, previous?: PracticeAttempt, random: () => number = Math.random): PracticeAttempt {
  const question = generateQuestion(options, previous?.question, random);
  const { metre, bpm, variant } = question;
  const base = buildPulsePlan({ pulseBpm: bpm, beatsPerBar: beatsPerBar(metre), responseBars: options.kind === 'silent-bar-timing' ? 4 : 1 });
  const barSeconds = base.beatsPerBar * base.pulseSeconds;
  if (options.kind === 'silent-bar-timing') {
    const silentBars = variant.silentBars!;
    const firstSilent = 4 - silentBars;
    const silentStart = base.targets.find(t => t.metadata!.bar === firstSilent && t.metadata!.beat === 1)!.atSeconds;
    const returnTime = base.targets.find(t => t.metadata!.bar === 4 && t.metadata!.beat === 1)!.atSeconds;
    const plan: PulsePlan = { ...base,
      stimulus: base.stimulus.filter(c => c.atSeconds < silentStart - 1e-9 || c.atSeconds >= returnTime - 1e-9),
      targets: base.targets.filter(t => t.metadata!.bar >= firstSilent && (t.metadata!.bar < 4 || t.metadata!.beat === 1)),
      responseWindow: { startSeconds: silentStart, endSeconds: returnTime + base.pulseSeconds * 0.5 },
    };
    validatePlan(plan);
    return { plan, metre, question, countInStart: 0, task: variant.title };
  }
  const tapBack = options.kind === 'rhythm-tap-back';
  const patternDuration = question.pattern.bars.length * barSeconds;
  const responseStart = tapBack ? barSeconds * 2 + patternDuration : barSeconds;
  const durationSeconds = responseStart + patternDuration;
  const cues: (PulseCue & { voice?: 'pattern' })[] = base.stimulus.filter(c => c.atSeconds < barSeconds);
  if (tapBack) {
    cues.push(...attacks(question.pattern).map(a => ({ atSeconds: barSeconds + a.atPulse * base.pulseSeconds, accent: false, level: 'pulse' as const, voice: 'pattern' as const })));
    cues.push(...base.stimulus.filter(c => c.atSeconds < barSeconds).map(c => ({ ...c, atSeconds: c.atSeconds + barSeconds + patternDuration })));
  }
  for (let beat = 0; beat < question.pattern.bars.length * base.beatsPerBar; beat++) cues.push({ atSeconds: responseStart + beat * base.pulseSeconds, accent: beat % base.beatsPerBar === 0, level: 'subdivision' });
  const patternAttacks = attacks(question.pattern);
  const gap = Math.min(base.pulseSeconds, ...patternAttacks.slice(1).map((a, i) => (a.atPulse - patternAttacks[i]!.atPulse) * base.pulseSeconds));
  const plan: PulsePlan = { ...base, durationSeconds, stimulus: cues.sort((a, b) => a.atSeconds - b.atSeconds),
    phases: tapBack ? [
      { kind: 'countIn', startSeconds: 0, endSeconds: barSeconds },
      { kind: 'listen', startSeconds: barSeconds, endSeconds: barSeconds + patternDuration },
      { kind: 'countIn', startSeconds: barSeconds + patternDuration, endSeconds: responseStart },
      { kind: 'respond', startSeconds: responseStart, endSeconds: durationSeconds },
    ] : [{ kind: 'countIn', startSeconds: 0, endSeconds: barSeconds }, { kind: 'respond', startSeconds: responseStart, endSeconds: durationSeconds }],
    responseWindow: { startSeconds: responseStart, endSeconds: durationSeconds },
    targets: patternAttacks.map(a => ({ targetId: a.id, atSeconds: responseStart + a.atPulse * base.pulseSeconds,
      associationRadiusSeconds: gap * 0.45, metadata: { bar: a.bar, beat: a.beat } })),
  };
  validatePlan(plan);
  return { plan, metre, question, countInStart: tapBack ? barSeconds + patternDuration : 0, task: variant.title };
}
