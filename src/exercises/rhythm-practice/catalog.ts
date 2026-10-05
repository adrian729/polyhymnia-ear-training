import type { Metre } from '../pulse-tapping/options';
import type { HelpSection, OverviewSection } from '../shared';
import { createResultStore } from '../shared/store';
import type { TimingPreferences } from '../shared/rhythm/store';

export const KINDS = ['rhythm-tap-back', 'rhythm-recognition', 'metre-identification', 'rhythm-reading', 'rhythm-error-detection', 'silent-bar-timing'] as const;
export type Kind = typeof KINDS[number];
export type Vocabulary = 'notes' | 'rests';
export interface PracticeOptions {
  kind: Kind;
  variants: readonly string[];
  metres: readonly Metre[];
  minBpm: number;
  maxBpm: number;
  questionCount: number | 'endless';
  autoNext: boolean;
}
export interface Variant {
  id: string; moduleId: string; title: string; text: string; metres: readonly Metre[];
  vocabulary?: Vocabulary; bars?: 1 | 2; silentBars?: 1 | 2; comparison?: 'heard' | 'score';
}
interface PracticeModule {
  id: string;
  title: string;
  text: string;
}
const SIMPLE = ['2/4', '3/4', '4/4'] as const;
const patternModules: readonly PracticeModule[] = [
  { id: 'notes', title: 'Quarter notes and eighth notes', text: 'One-bar patterns of quarter notes and paired eighth notes, first in 2/4 and then in 4/4.' },
  { id: 'rests', title: 'Rhythms with quarter rests', text: 'One-bar patterns in 4/4 combining quarter notes, paired eighth notes and quarter rests.' },
];
const patterns: readonly Variant[] = [
  { id: 'two', moduleId: 'notes', title: 'Two-beat patterns', text: 'One bar of quarter notes and paired eighth notes in 2/4.', metres: ['2/4'], vocabulary: 'notes', bars: 1 },
  { id: 'four', moduleId: 'notes', title: 'Four-beat patterns', text: 'One bar of quarter notes and paired eighth notes in 4/4.', metres: ['4/4'], vocabulary: 'notes', bars: 1 },
  { id: 'rests', moduleId: 'rests', title: 'Patterns with rests', text: 'One bar in 4/4, adding quarter rests.', metres: ['4/4'], vocabulary: 'rests', bars: 1 },
];
export const CATALOG: Record<Kind, { title: string; blurb: string; modules: readonly PracticeModule[]; variants: readonly Variant[]; timed: boolean }> = {
  'rhythm-tap-back': { title: 'Rhythm Tap-back', blurb: 'Listen to a short rhythm, then tap it back at the same tempo.', modules: patternModules, variants: patterns, timed: true },
  'rhythm-recognition': { title: 'Rhythm Recognition', blurb: 'Match a heard rhythm to one of three written patterns.', modules: patternModules, variants: patterns, timed: false },
  'rhythm-reading': { title: 'Rhythm Reading', blurb: 'Read a short rhythm and tap its note attacks, leaving space for rests.', modules: patternModules, variants: patterns, timed: true },
  'metre-identification': { title: 'Metre Identification', blurb: 'Listen for accented groups and identify their metre.', timed: false, modules: [
    { id: 'simple', title: 'Simple metres — 2/4, 3/4 and 4/4', text: 'Identify groups of two, three or four quarter-note beats from their accents.' },
    { id: 'compound', title: 'Simple and compound metre — 3/4 vs 6/8', text: 'Distinguish three quarter-note beats in 3/4 from two dotted-quarter beats in 6/8 through grouping and subdivisions.' },
  ], variants: [
    { id: 'two-three', moduleId: 'simple', title: 'Two or three beats', text: 'Distinguish clear accented groups in 2/4 and 3/4.', metres: ['2/4', '3/4'] },
    { id: 'simple', moduleId: 'simple', title: 'Two, three or four beats', text: 'Add 4/4, with a stronger first beat and weaker middle accent.', metres: SIMPLE },
    { id: 'compound', moduleId: 'compound', title: 'Simple or compound', text: 'Distinguish 3/4 from 6/8 through grouping and subdivisions.', metres: ['3/4', '6/8'] },
  ] },
  'rhythm-error-detection': { title: 'Rhythm Error Detection', blurb: 'Compare similar rhythms, first by ear and then against a score.', timed: false, modules: [
    { id: 'by-ear', title: 'Rhythm comparison — By ear', text: 'Listen to two similar one-bar rhythms in 4/4 and decide whether they are the same or different.' },
    { id: 'with-score', title: 'Rhythm comparison — Against a score', text: 'Compare a two-bar score in 4/4 with the rhythm you hear and identify the changed bar, first with notes only and then with rests.' },
  ], variants: [
    { id: 'heard', moduleId: 'by-ear', title: 'Same or different?', text: 'Hear two related one-bar rhythms in 4/4. Different examples change two beats.', metres: ['4/4'], vocabulary: 'notes', bars: 1, comparison: 'heard' },
    { id: 'score', moduleId: 'with-score', title: 'Find the changed bar', text: 'Read two bars in 4/4 and find the one containing a changed beat.', metres: ['4/4'], vocabulary: 'notes', bars: 2, comparison: 'score' },
    { id: 'rests', moduleId: 'with-score', title: 'Find the changed bar with rests', text: 'Two-bar comparisons including quarter rests; exactly one bar differs.', metres: ['4/4'], vocabulary: 'rests', bars: 2, comparison: 'score' },
  ] },
  'silent-bar-timing': { title: 'Silent-bar Timing', blurb: 'Keep tapping the pulse when the metronome falls silent.', timed: true, modules: [
    { id: 'one-silent', title: 'Keep the pulse — One silent bar', text: 'Keep tapping through one silent bar in 4/4 or 3/4, then check your timing as the metronome returns.' },
    { id: 'two-silent', title: 'Keep the pulse — Two silent bars', text: 'Keep tapping through two silent bars in 4/4 before the metronome returns.' },
  ], variants: [
    { id: 'four', moduleId: 'one-silent', title: 'One silent bar in 4/4', text: 'Two audible bars, one silent bar, then the metronome returns.', metres: ['4/4'], silentBars: 1 },
    { id: 'three', moduleId: 'one-silent', title: 'One silent bar in 3/4', text: 'Keep groups of three through one silent bar.', metres: ['3/4'], silentBars: 1 },
    { id: 'two-silent', moduleId: 'two-silent', title: 'Two silent bars in 4/4', text: 'One audible bar, two silent bars, then the metronome returns.', metres: ['4/4'], silentBars: 2 },
  ] },
};
export function defaults(kind: Kind): PracticeOptions {
  const variant = CATALOG[kind].variants[0]!;
  return { kind, variants: [variant.id], metres: [...variant.metres], minBpm: 70, maxBpm: 100, questionCount: 5, autoNext: false };
}
export function lessons(kind: Kind) {
  return CATALOG[kind].variants.map(variant => ({ id: variant.id, moduleId: variant.moduleId, title: variant.title,
    options: { ...defaults(kind), variants: [variant.id], metres: [...variant.metres], ...(variant.id === 'compound' ? { minBpm: 60, maxBpm: 90 } : {}) } }));
}
export function modules(kind: Kind) {
  return CATALOG[kind].modules.map(({ id, title, text }) => ({ id, title,
    help: [{ heading: CATALOG[kind].title, text: CATALOG[kind].blurb }, { heading: title, text }] as readonly HelpSection[] }));
}
export function overview(kind: Kind): readonly OverviewSection[] {
  return [{ heading: CATALOG[kind].title, intro: CATALOG[kind].blurb, items: [
    { term: 'Lessons', text: 'Five attempts with fresh examples and preset tempo ranges. Custom practice has its own selections and tempo range.' },
    { term: 'Pass', text: CATALOG[kind].timed ? 'Each attempt passes at 80% accuracy: on-time targets divided by targets plus extra taps. A lesson passes at 80% average accuracy.' : 'Four correct answers out of five pass a lesson.' },
    { term: 'Task', text: kind === 'silent-bar-timing' ? 'Tap throughout. Only the silent beats and the first returning beat are graded; audible lead-in bars are practice. There is no moving guide during the response.' : CATALOG[kind].timed ? 'Use Space or the tap pad. Quarter and eighth note attacks are graded, including missed notes and extra taps in rests; note length is not graded. Interrupted attempts restart without a score.' : kind === 'metre-identification' ? 'These are deliberately accented teaching patterns. Listen for grouping; an arbitrary musical excerpt may admit more than one metrical interpretation.' : 'Replay the question before answering. After answering, compare the patterns using their playback controls.' },
  ] }];
}
export function validateOptions(options: PracticeOptions): string[] {
  const errors: string[] = [];
  const variants = CATALOG[options.kind].variants;
  if (!options.variants.length || options.variants.some(id => !variants.some(v => v.id === id))) errors.push('Select at least one supported variation.');
  if (!options.metres.length || options.metres.some(m => !['2/4', '3/4', '4/4', '6/8'].includes(m))) errors.push('Select at least one supported metre.');
  for (const id of options.variants) {
    const v = variants.find(v => v.id === id);
    if (v && !options.metres.some(m => v.metres.includes(m))) errors.push(`${v.title} needs ${v.metres.join(' or ')}.`);
    if (v && options.kind === 'metre-identification' && v.metres.filter(m => options.metres.includes(m)).length < 2) errors.push(`${v.title} needs at least two of its metres.`);
  }
  if (options.metres.some(m => !variants.some(v => options.variants.includes(v.id) && v.metres.includes(m)))) errors.push('Every selected metre needs a compatible variation.');
  if (![options.minBpm, options.maxBpm].every(Number.isInteger) || options.minBpm < 40 || options.maxBpm > 180 || options.minBpm > options.maxBpm) errors.push('Choose a tempo range within 40–180 pulse BPM, with minimum no greater than maximum.');
  if (options.questionCount !== 'endless' && (!Number.isInteger(options.questionCount) || options.questionCount < 1 || options.questionCount > 200)) errors.push('Choose 1–200 attempts, or endless.');
  return errors;
}
export const resultStore = createResultStore('polyhymnia:rhythm:choice-results:v1');
export function resultKey(lessonId: string, options: PracticeOptions, preferences?: TimingPreferences) {
  return JSON.stringify({ version: 1, lessonId, options, ...(preferences ? { tolerance: preferences.tolerance, customMs: preferences.tolerance === 'custom' ? preferences.customMs : undefined } : {}) });
}
