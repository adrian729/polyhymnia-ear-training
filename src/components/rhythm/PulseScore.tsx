import { useMemo, type CSSProperties } from 'react';
import type { Event, NoteValue, Time } from '@polyhymnia/mnx';
import type { NotationOptions } from '@polyhymnia/notation-engine';
import { Notation } from '@polyhymnia/notation-react';
import type { PulsePlan } from '@polyhymnia/rhythm';
import { buildMeasureScore, noteEvent } from '@/components/presets/mnxBuild';
import type { Metre } from '@/exercises/pulse-tapping/options';
import { cn } from '@/lib/utils';

const SCORE_OPTIONS: NotationOptions = { widthSp: 48, maxLastSystemFill: 1 };

/** One bar of tapping targets, driven by the attempt's existing audio clock. */
export function PulseScore({ plan, metre, phase, playbackTimeSeconds, playing }: {
  plan: PulsePlan;
  metre: Metre;
  phase: 'countIn' | 'respond';
  playbackTimeSeconds: number;
  playing: boolean;
}) {
  const score = useMemo(() => {
    const [count, unit] = metre.split('/').map(Number);
    const duration: NoteValue = { base: 'quarter', ...(metre === '6/8' ? { dots: 1 } : {}) };
    const targetBeats = new Set(plan.targets.filter(target => target.metadata?.bar === 1).map(target => target.metadata?.beat));
    const events: Event[] = Array.from({ length: plan.beatsPerBar }, (_, index) => ({
      ...(phase === 'countIn' || targetBeats.has(index + 1) ? noteEvent('B4', duration) : { duration, rest: {} }),
      id: `pulse-beat-${index + 1}`,
    }));
    return buildMeasureScore('treble', { count: count!, unit: unit as Time['unit'] }, events);
  }, [plan, metre, phase]);
  const start = phase === 'countIn' ? 0 : plan.responseWindow.startSeconds;
  const end = phase === 'countIn' ? plan.responseWindow.startSeconds : plan.responseWindow.endSeconds;
  const beat = playing && playbackTimeSeconds >= start && playbackTimeSeconds < end
    ? Math.floor((playbackTimeSeconds - start) / plan.pulseSeconds) % plan.beatsPerBar + 1 : undefined;
  const view = useMemo(() => ({ mode: 'notes' as const, activeIds: beat === undefined ? [] : [`pulse-beat-${beat}`] }), [beat]);
  const color = phase === 'countIn' ? 'var(--rubric-strong)' : 'var(--primary-strong)';
  return <div role="img" aria-label={`${phase === 'countIn' ? 'Count-in' : 'Response'} score in ${metre}`}
    className="flex h-28 w-full items-center justify-center" data-rhythm-phase={phase}>
    <Notation score={score} options={SCORE_OPTIONS}
      className={cn('w-full max-w-xl', phase === 'countIn' && '[&_[data-pn=element]]:opacity-40 [&_[data-pn=element][data-pn-playing=true]]:opacity-100')}
      style={{ '--pn-playing': color, ...(phase === 'countIn' ? { '--pn-ink': color } : {}) } as CSSProperties}>
      <Notation.Playback view={view} />
    </Notation>
  </div>;
}
