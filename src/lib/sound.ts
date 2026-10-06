import { createAudioContext, createSharedPlayer, defaultInstrument, unlockAudio } from '@polyhymnia/web-audio/webaudio';
import type { Playback, PlayResult, Player } from '@polyhymnia/web-audio/webaudio';
import { createSampler, type Sampler } from '@polyhymnia/web-audio/sampler';
import type { Instrument, NoteEvent } from '@polyhymnia/web-audio';
import { isInstrumentId, sampleList, type InstrumentId, type SampledInstrumentId } from './instruments';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'polyhymnia:instrument';
/**
 * Longest a play waits when one of its notes has no usable sample yet (a deep link's first question,
 * or just after switching instrument). It waits for the notes' own samples; past this it starts with
 * the best loaded ones, borrowed or the synth.
 */
const SAMPLE_WAIT_MS = 500;

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  stop(): void;
}

let choice: InstrumentId = 'synth';
const samplers = new Map<SampledInstrumentId, Sampler>();
const listeners = new Set<() => void>();
let warming: AbortController | undefined;
let loading = false;

export function getInstrument(): InstrumentId {
  return choice;
}

/** Whether the chosen instrument is still loading the samples every note needs to play. */
export function isInstrumentLoading(): boolean {
  return loading;
}

function setLoading(next: boolean): void {
  if (loading === next) return;
  loading = next;
  listeners.forEach((listener) => listener());
}

export function subscribeInstrument(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setInstrument(id: InstrumentId): void {
  choice = id;
  writeJson(STORAGE_KEY, id);
  listeners.forEach((listener) => listener());
  warmInstrument();
}

/**
 * Loads the chosen instrument in the background, coarse to fine (web-audio `warm`): one sample per
 * octave, after which every note plays, then one every third semitone. Runs once the first screen
 * is up and the browser is idle, and again at once whenever the instrument changes.
 */
export function warmInstrument(): void {
  warming?.abort();
  warming = undefined;
  const sampler = currentSampler();
  if (!sampler || choice === 'synth') {
    setLoading(false);
    return;
  }
  const controller = new AbortController();
  warming = controller;
  setLoading(!sampler.canPlay(sampleList(choice).map((sample) => sample.midi)));
  void sampler.warm(controller.signal).finally(() => {
    if (warming === controller) setLoading(false);
  });
}

const stored = readJson(STORAGE_KEY);
if (isInstrumentId(stored)) choice = stored;

// One sampler per instrument, sharing the audio context. It loads nothing until notes need it:
// each sample is fetched, decoded and measured the first time a note plays from it.
function currentSampler(): Sampler | undefined {
  if (choice === 'synth') return undefined;
  let sampler = samplers.get(choice);
  if (!sampler) {
    const ctx = createAudioContext();
    sampler = createSampler(ctx, { out: ctx.destination, samples: sampleList(choice), fallback: defaultInstrument(ctx) });
    samplers.set(choice, sampler);
  }
  return sampler;
}

/** Starts loading the samples these notes play from, for audio that is known before it plays. */
export function prepareNotes(midis: readonly number[]): void {
  void currentSampler()?.prepare(midis).catch(() => {});
}

function currentInstrument(ctx: AudioContext): Instrument {
  const synth = defaultInstrument(ctx);
  const active = () => currentSampler() ?? synth;
  return {
    noteOn: (...args) => active().noteOn(...args),
    stopAll: () => active().stopAll(),
  };
}

/** A playback that starts once `ready` settles (or the wait runs out), unless stopped first. */
function startWhen(ready: Promise<unknown>, start: () => Playback): Playback {
  let playback: Playback | undefined;
  let stopped = false;
  let settle: (result: PlayResult) => void = () => {};
  const finished = new Promise<PlayResult>((resolve) => { settle = resolve; });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<void>((resolve) => { timer = setTimeout(resolve, SAMPLE_WAIT_MS); });
  void Promise.race([ready.catch(() => {}), waited]).then(() => {
    clearTimeout(timer);
    if (stopped) return;
    playback = start();
    void playback.finished.then(settle);
  });
  return {
    time: () => playback?.time() ?? 0,
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      playback?.stop();
      settle('stopped');
    },
    finished,
    clock: (source) => playback?.clock?.(source),
  };
}

export function createSound(): Sound {
  let player: Player | undefined;
  let pending: Playback | undefined;
  const get = () => (player ??= createSharedPlayer(currentInstrument));
  return {
    playEvents: (events, lead) => {
      pending?.stop();
      pending = undefined;
      const play = () => get().play(events, lead === undefined ? undefined : { lead });
      const sampler = currentSampler();
      const midis = events.map((event) => event.midi);
      // Every note has a usable sample (its own or a near one), or synth: play now, inside the
      // gesture that asked. Otherwise wait briefly, for the notes' own samples.
      if (!sampler || sampler.canPlay(midis)) return play();
      void createAudioContext().resume().catch(() => {});
      const later = startWhen(sampler.prepare(midis), play);
      pending = later;
      return later;
    },
    stop: () => {
      pending?.stop();
      pending = undefined;
      player?.stop();
    },
  };
}

export function unlockSound(): () => void {
  return unlockAudio(createAudioContext());
}
