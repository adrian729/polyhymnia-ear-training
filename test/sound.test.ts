import { describe, expect, it, vi } from 'vitest';

const audio = vi.hoisted(() => {
  const state = { ready: false, arrive: () => {}, play: vi.fn() };
  const playback = () => ({ time: () => 0, stop: () => {}, finished: Promise.resolve('ended' as const) });
  state.play.mockImplementation(playback);
  return state;
});

vi.mock('@polyhymnia/web-audio/webaudio', () => ({
  createAudioContext: () => ({ destination: {}, resume: () => Promise.resolve() }),
  createSharedPlayer: () => ({ play: audio.play, stop: () => {} }),
  defaultInstrument: () => ({ noteOn: () => {}, stopAll: () => {} }),
  unlockAudio: () => () => {},
}));
vi.mock('@polyhymnia/web-audio/sampler', () => ({
  createSampler: () => ({
    canPlay: () => audio.ready,
    prepare: () => new Promise<void>((resolve) => { audio.arrive = () => { audio.ready = true; resolve(); }; }),
    warm: () => Promise.resolve(),
    noteOn: () => {},
    stopAll: () => {},
  }),
}));

const { createSound, setInstrument } = await import('@/lib/sound');
const note = [{ midi: 60, start: 0, duration: 1 }];
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('sound with a sampled instrument', () => {
  it('plays once a usable sample arrives, at once when one is loaded, and never after a stop', async () => {
    setInstrument('piano');
    const sound = createSound();

    sound.playEvents(note);
    expect(audio.play).not.toHaveBeenCalled();
    audio.arrive();
    await settled();
    expect(audio.play).toHaveBeenCalledTimes(1);

    sound.playEvents(note);
    expect(audio.play).toHaveBeenCalledTimes(2);

    audio.ready = false;
    const stopped = sound.playEvents(note);
    sound.stop();
    audio.arrive();
    await settled();
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(await stopped.finished).toBe('stopped');
  });
});
