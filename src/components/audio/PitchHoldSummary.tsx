import { centsBetweenFrequencies, midiToFrequency } from '@polyhymnia/music-theory';
import type { PitchHoldStatistics } from '@/exercises/pitch-matching/match';

/** Measurements are frozen to the accepted hold, not subsequent microphone input. */
export function PitchHoldSummary({ target, statistics }: { target: number; statistics: PitchHoldStatistics }) {
  const referenceHz = midiToFrequency(target);
  const rows = [['Minimum', statistics.minimumHz], ['Average', statistics.averageHz], ['Maximum', statistics.maximumHz]] as const;
  return <section aria-label="Accepted pitch measurements" className="flex min-w-0 flex-col gap-tight border-t border-border pt-base">
    <h3 className="font-specimen text-meta text-foreground">Accepted hold · <span className="font-mono">{Math.round(statistics.seconds * 1000)} ms</span></h3>
    <table className="w-full text-meta">
      <thead><tr className="text-muted-foreground">
        <th scope="col" className="pb-tight text-left font-normal">Pitch</th>
        <th scope="col" className="pb-tight text-right font-normal">Frequency</th>
        <th scope="col" className="pb-tight text-right font-normal">From target</th>
      </tr></thead>
      <tbody>{rows.map(([label, hz]) => {
        const cents = Math.round(centsBetweenFrequencies(hz, referenceHz) * 10) / 10;
        return <tr key={label}>
          <th scope="row" className="py-tight text-left font-normal">{label}</th>
          <td className="py-tight text-right font-mono">{hz.toFixed(1)} Hz</td>
          <td className="py-tight text-right font-mono">{cents > 0 ? '+' : ''}{cents.toFixed(1)} cents</td>
        </tr>;
      })}</tbody>
    </table>
  </section>;
}
