import { useEffect, useState } from 'react';
import type { Playback } from '@polyhymnia/web-audio/webaudio';
import { Initial } from '@/components/Initial';
import { cn } from '@/lib/utils';

export interface PlaybackSegment {
  start: number;
  end: number;
  phase: string;
  label: string;
  letter?: 'A' | 'B';
}

/** Audio-clock cues also follow replays, cancellations and trailing rests. */
export function PlaybackCue({ playback, segments, idleLabel = 'Listen to the rhythm.' }: {
  playback?: Playback;
  segments: readonly PlaybackSegment[];
  idleLabel?: string;
}) {
  const [phase, setPhase] = useState('idle');
  useEffect(() => {
    if (!playback) { setPhase('idle'); return; }
    let disposed = false;
    let frame: number;
    const tick = () => {
      const time = playback.time();
      setPhase(segments.find(segment => time >= segment.start && time < segment.end)?.phase ??
        (time >= (segments.at(-1)?.end ?? Infinity) ? 'finished' : 'idle'));
      frame = requestAnimationFrame(tick);
    };
    tick();
    void playback.finished.then(result => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      setPhase(result === 'ended' ? 'finished' : 'idle');
    });
    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, [playback, segments]);
  const active = segments.find(segment => segment.phase === phase);
  const hasLetters = segments.some(segment => segment.letter);
  return <div role="status" aria-live="polite" data-playback-phase={phase} className="flex flex-col items-center gap-tight">
    {hasLetters && <span aria-hidden="true" className={cn(!active?.letter && 'invisible')}>
      <Initial letter={active?.letter ?? 'A'} className="text-display leading-none [--initial-letter:var(--primary-strong)] [--initial-frame:var(--rubric)]" />
    </span>}
    <span className="rubricated font-specimen text-meta text-muted-foreground">{active?.label ?? (phase === 'finished' ? 'Playback finished.' : idleLabel)}</span>
  </div>;
}
