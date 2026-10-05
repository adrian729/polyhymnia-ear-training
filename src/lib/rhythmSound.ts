import { clickInstrument, percussionInstrument, createAudioContext, createPlayer, createSharedPlayer, type PercussionSound, type Playback, type PlaybackClockSource, type Player } from '@polyhymnia/web-audio/webaudio';
import type { Instrument, NoteEvent } from '@polyhymnia/web-audio';
import type { PulseCue } from '@polyhymnia/rhythm';
import type { PlaybackOptions, RhythmPlaybackHandle, RhythmPlaybackPort } from '@polyhymnia/rhythm/browser';
import type { Sound } from './sound';

function practiceInstrument(ctx: AudioContext): Instrument {
  const click = clickInstrument(ctx, { out: ctx.destination });
  const pattern = percussionInstrument(ctx, { out: ctx.destination, sound: 'woodblock' });
  const comparison = percussionInstrument(ctx, { out: ctx.destination, sound: 'kick' });
  // App rhythm events use 60 for model/A, 61 for comparison/B; other notes are metronome cues.
  return { noteOn: (midi, ...args) => (midi === 60 ? pattern : midi === 61 ? comparison : click).noteOn(midi, ...args),
    stopAll() { click.stopAll(); pattern.stopAll(); comparison.stopAll(); } };
}
/** Same percussion voice for a model rhythm and its answer replays. */
let currentPracticePlayback: Playback | undefined;
export function createPracticeSound(): Sound {
  let player: Player | undefined;
  return { playEvents(events, lead) {
    currentPracticePlayback?.stop();
    return currentPracticePlayback = (player ??= createSharedPlayer(practiceInstrument)).play(events, { lead });
  },
    stop: () => player?.stop() };
}

/** Audio backend only: timing, capture and matching live in the rhythm packages. */
export interface RhythmSound extends RhythmPlaybackPort<readonly PulseCue[]> {
  feedbackTap(signal: AbortSignal): Promise<void>;
  stopFeedback(): void;
}
export function createRhythmSound(volume: number, feedbackSound: PercussionSound = 'woodblock', feedbackVolume = 0.7): RhythmSound {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new RangeError('Invalid click volume.');
  if (!Number.isFinite(feedbackVolume) || feedbackVolume < 0 || feedbackVolume > 1) throw new RangeError('Invalid feedback volume.');
  let ctx: AudioContext;
  let player: Player;
  let feedback: Instrument;
  const events = (cues: readonly PulseCue[]): NoteEvent[] => cues.map(cue => {
    if (!Number.isFinite(cue.atSeconds) || cue.atSeconds < 0) throw new RangeError('Invalid click time.');
    const pattern = 'voice' in cue && cue.voice === 'pattern';
    return { start: cue.atSeconds, duration: 0.035, midi: pattern ? 60 : cue.accent ? 84 : 76,
      velocity: pattern ? 0.8 : volume * (cue.level === 'subdivision' ? 0.25 : cue.accent ? 0.9 : 0.65) };
  });
  const wrap = (playback: Playback): RhythmPlaybackHandle => ({
    finished: playback.finished,
    clock(sourceKey) {
      if (!['outputTimestamp', 'latencyEstimate', 'uncorrected'].includes(sourceKey)) return undefined;
      const pair = playback.clock?.(sourceKey as PlaybackClockSource);
      if (!pair) return undefined;
      return { ...pair, sourceKey: pair.source,
        continuityKey: JSON.stringify([pair.source, pair.latencyStages, (ctx as AudioContext & { sinkId?: unknown }).sinkId ?? 'default']) };
    },
    onInterrupted(listener) {
      const state = () => { if (ctx.state !== 'running') listener('Audio was suspended. Restart this attempt.'); };
      const sink = () => listener('Audio output changed. Restart this attempt.');
      ctx.addEventListener('statechange', state);
      ctx.addEventListener('sinkchange', sink);
      return () => { ctx.removeEventListener('statechange', state); ctx.removeEventListener('sinkchange', sink); };
    },
    stop: () => playback.stop(),
  });
  const play = (notes: readonly NoteEvent[], options: PlaybackOptions) => {
    if (!player) throw new Error('Prepare audio before playback.');
    return wrap(player.play(notes, { lead: options.leadSeconds, durationSeconds: options.durationSeconds }));
  };
  const prepare = async (signal: AbortSignal) => {
    if (signal.aborted) throw new Error('Preparation cancelled.');
    ctx ??= createAudioContext();
    player ??= createPlayer(ctx, practiceInstrument(ctx));
    await ctx.resume();
    if (signal.aborted) throw new Error('Preparation cancelled.');
    if (ctx.state !== 'running') throw new Error('Audio is unavailable. Start again to enable it.');
  };
  return {
    clockSourcesByPreference: ['outputTimestamp', 'latencyEstimate', 'uncorrected'],
    prepare,
    async feedbackTap(signal) {
      // A separate voice confirms input without replacing the timed playback.
      if (!ctx || ctx.state !== 'running') await prepare(signal);
      if (signal.aborted) return;
      feedback ??= percussionInstrument(ctx, { out: ctx.destination, sound: feedbackSound });
      feedback.noteOn(60, ctx.currentTime, 0.1, feedbackVolume);
    },
    stopFeedback() { feedback?.stopAll(); },
    validateStimulus(cues) { return { lastAudioEndSeconds: events(cues).reduce((end, note) => Math.max(end, note.start + note.duration), 0) }; },
    playSilence: options => play([], options),
    play: (cues, options) => play(events(cues), options),
  };
}
