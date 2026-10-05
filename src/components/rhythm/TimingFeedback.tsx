import { timingAccuracy, type PulseMetadata, type TimingAnalysis } from '@polyhymnia/rhythm';
import { TimingPlot } from '@polyhymnia/rhythm-react';
import { RHYTHM_PASS_PERCENT } from '@/exercises/shared/rhythm/session';

export const TIMING_LEGEND = '↑ Late · ↓ Early · ● On time · ○ Outside tolerance · × Missed. Small marks: tolerance; numbers: targets.';

export function TimingFeedback({ result, showAccuracy = true, showLegend = true }: {
  result: TimingAnalysis<PulseMetadata>;
  showAccuracy?: boolean;
  showLegend?: boolean;
}) {
  const signed = result.medianErrorSeconds;
  return <section className="flex min-w-0 flex-col gap-tight" aria-label="Attempt feedback">
    {showAccuracy && <p className="font-display text-heading text-primary-strong">{timingAccuracy(result).toFixed(1)}% accuracy
      <span className="ml-2 font-normal text-meta text-muted-foreground">{RHYTHM_PASS_PERCENT}% to pass</span>
    </p>}
    <p className="text-meta">{result.onTime} on time · {result.early} early · {result.late} late · {result.missed} missed · {result.extras.length} extra</p>
    {signed !== undefined && <p className="text-meta text-muted-foreground">Median: {Math.abs(signed * 1000).toFixed(0)} ms {signed === 0 ? 'on time' : signed < 0 ? 'early' : 'late'}
      {result.medianAbsoluteErrorSeconds !== undefined && ` · Median absolute error: ${(result.medianAbsoluteErrorSeconds * 1000).toFixed(0)} ms`}
      {result.driftSecondsPerSecond !== undefined && ` · Drift: ${(result.driftSecondsPerSecond * 1000).toFixed(1)} ms/s`}</p>}
    <TimingPlot result={result} className="text-primary-strong [&_svg]:max-h-40!" />
    {showLegend && <p className="text-meta text-muted-foreground">{TIMING_LEGEND}</p>}
  </section>;
}
