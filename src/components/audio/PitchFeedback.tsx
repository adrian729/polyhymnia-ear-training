import type { PitchObservation } from '@polyhymnia/audio-analysis';
import { centsBetweenFrequencies, midiToFrequency } from '@polyhymnia/music-theory';
import { noteName, type describePitch, type PitchHoldStatistics } from '@/exercises/pitch-matching/match';
import { cn } from '@/lib/utils';
import { PitchHoldSummary } from './PitchHoldSummary';

/** Exercise feedback: cents are relative to the reference, including its octave. */
export function PitchFeedback({ target, pitch, status, active, matched, held, seconds, cents, statistics }: {
  target: number;
  pitch: ReturnType<typeof describePitch>;
  status?: PitchObservation['status'];
  active: boolean;
  matched: boolean;
  held: number;
  seconds: number;
  cents: number;
  statistics?: PitchHoldStatistics;
}) {
  const current = active ? pitch : undefined;
  const referenceHz = midiToFrequency(target);
  const accepted = matched && statistics ? {
    minimum: centsBetweenFrequencies(statistics.minimumHz, referenceHz),
    maximum: centsBetweenFrequencies(statistics.maximumHz, referenceHz),
    average: centsBetweenFrequencies(statistics.averageHz, referenceHz),
  } : undefined;
  const guideCents = accepted?.average ?? current?.cents;
  const guidePosition = (value: number) => 50 + Math.max(-100, Math.min(100, value)) / 2;
  const within = !!current && Math.abs(current.cents) <= cents;
  const instruction = matched ? 'Matched' : !active ? 'Listen first'
    : !current ? status === 'uncertain' ? 'Sing one clear, steady note' : 'Sing when you are ready'
      : within ? 'Hold steady' : current.cents < 0 ? 'Sing higher' : 'Sing lower';
  return <section aria-label="Live pitch feedback" className="flex flex-col gap-base">
    <div className="grid grid-cols-[3fr_2fr] gap-base border-y border-border py-base">
      <div className="flex flex-col gap-tight">
        <h3 className="rubricated font-specimen text-meta text-muted-foreground">Reference note</h3>
        <p className="font-mono text-title">{noteName(target)}</p>
      </div>
      <div className="flex flex-col gap-tight border-l border-border pl-base">
        <h3 className="rubricated font-specimen text-meta text-muted-foreground">Your voice</h3>
        <p className={cn('font-mono text-title', matched && 'text-success-strong')}>{matched ? noteName(target) : current?.note ?? '—'}</p>
      </div>
    </div>
    <div className="flex flex-col gap-tight">
      <div className="flex items-baseline justify-between gap-base">
        <p className={cn('text-meta', within || matched ? 'text-success-strong' : 'text-muted-foreground')}>{instruction}</p>
        <p className="font-mono text-meta text-muted-foreground">{guideCents !== undefined ? `${guideCents > 0 ? '+' : ''}${Math.round(guideCents)} cents${accepted ? ' avg' : ''}` : '—'}</p>
      </div>
      <div className="relative h-8" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 border-t border-border" />
        <span className="absolute inset-y-tight border-x border-border bg-muted/50" style={{ left: `${50 - cents / 2}%`, right: `${50 - cents / 2}%` }} />
        <span className="absolute inset-y-0 left-1/2 border-l border-foreground" />
        {accepted && <span data-pitch-statistic="range" className="absolute inset-y-0 border-x border-success-strong bg-success/20"
          style={{ left: `${guidePosition(accepted.minimum)}%`, width: `${guidePosition(accepted.maximum) - guidePosition(accepted.minimum)}%` }} />}
        {guideCents !== undefined && <span data-pitch-statistic={accepted ? 'average' : 'live'} className={cn('absolute inset-y-tight w-tight -translate-x-1/2 rounded border',
          within || matched ? 'border-success-strong bg-success' : 'border-foreground bg-foreground')}
          style={{ left: `${guidePosition(guideCents)}%` }} />}
      </div>
      <div className="flex justify-between font-specimen text-meta text-muted-foreground" aria-hidden="true"><span>Flat</span><span>In tune</span><span>Sharp</span></div>
      {accepted && <p className="text-meta text-success-strong">Min–max range · marker shows average</p>}
    </div>
    <div className="flex flex-col gap-tight">
      <p className="text-meta text-muted-foreground">{matched ? 'Hold complete' : `Hold the note for ${seconds} s`}</p>
      <div role="progressbar" aria-label="Continuous pitch match" aria-valuemin={0} aria-valuemax={seconds}
        aria-valuenow={matched ? seconds : Math.min(seconds, held)} aria-valuetext={matched ? 'Complete' : `${held.toFixed(1)} of ${seconds} seconds`}
        className="h-tight overflow-hidden rounded border border-border bg-muted/50">
        <div className="h-full bg-success" style={{ width: `${matched ? 100 : Math.min(100, held / seconds * 100)}%` }} />
      </div>
    </div>
    {matched && statistics && <PitchHoldSummary target={target} statistics={statistics} />}
  </section>;
}
