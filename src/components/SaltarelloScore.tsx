import { useCallback, useEffect, useRef, useState } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import { DEFAULT_FONTS, DEFAULT_STYLE } from '@polyhymnia/notation-engine';
import type { NotationHandle, PlaybackView } from '@polyhymnia/notation-react';
import type { MnxDocument } from '@polyhymnia/mnx';
import { performance } from '@polyhymnia/mnx-score';
import saltarello from '@/assets/scores/saltarello.mnx.json';
import type { Playback } from '@polyhymnia/web-audio/webaudio';
import { createSound, prepareNotes } from '@/lib/sound';
import { prefetchFontFiles } from '@/lib/fonts';

const CURSOR_VIEW: PlaybackView = { mode: 'cursor', highlightActive: true };
const OFF_VIEW: PlaybackView = { mode: 'off' };
const SCORE = saltarello as MnxDocument;

/** Fetches the font the score draws with (it passes no options: the engine's default style), so its
 *  notes show the moment it renders instead of blank until the font arrives. */
export function prepare(): Promise<unknown> {
  return prefetchFontFiles(DEFAULT_FONTS[DEFAULT_STYLE].name);
}

/** The home page's playable Saltarello. Loaded on demand: it brings the notation code with it. */
export default function SaltarelloScore() {
  const handleRef = useRef<NotationHandle>(null);
  const frameRef = useRef(0);
  const playbackRef = useRef<Playback | null>(null);
  const [sound] = useState(createSound);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    const playback = playbackRef.current;
    playbackRef.current = null;
    playback?.stop();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const timeline = handle.getTimeline();
    const performed = performance(timeline);
    const events = performed.events.map((e) => ({
      id: e.id,
      midi: e.midi,
      start: e.startSeconds,
      duration: e.durationSeconds,
      ...(e.velocity !== undefined ? { velocity: e.velocity } : {}),
    }));
    const playback = sound.playEvents(events);
    playbackRef.current = playback;
    setPlaying(true);
    const tick = () => {
      const current = handleRef.current;
      if (playbackRef.current !== playback || !current || current.getTimeline() !== timeline) {
        if (playbackRef.current === playback) stop();
        return;
      }
      current.setPlaybackTick(performed.tickAtSeconds(playback.time()));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    void playback.finished.then(() => {
      if (playbackRef.current === playback) stop();
    });
  }, [sound, stop]);

  useEffect(() => stop, [stop]);

  // It mounts as the reader approaches, before anyone can press play: load its notes now.
  useEffect(() => {
    const timeline = handleRef.current?.getTimeline();
    if (timeline) prepareNotes(performance(timeline).events.map((event) => event.midi));
  }, []);

  return (
    <button
      type="button"
      onClick={playing ? stop : play}
      aria-label={playing ? 'Stop the Saltarello' : 'Play the Saltarello'}
      className="w-full cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Notation score={SCORE} ref={handleRef}>
        <Notation.Playback view={playing ? CURSOR_VIEW : OFF_VIEW} />
      </Notation>
    </button>
  );
}
