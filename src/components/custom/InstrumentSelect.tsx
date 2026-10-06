import { useSyncExternalStore } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INSTRUMENTS, isInstrumentId } from '@/lib/instruments';
import { getInstrument, isInstrumentLoading, setInstrument, subscribeInstrument } from '@/lib/sound';

export function InstrumentSelect() {
  const instrument = useSyncExternalStore(subscribeInstrument, getInstrument, getInstrument);
  // Until one sample per octave is in, some notes would still play on the synth. The picker says
  // so in its own fixed-width box, so nothing around it moves.
  const loading = useSyncExternalStore(subscribeInstrument, isInstrumentLoading, isInstrumentLoading);
  const label = INSTRUMENTS.find(({ id }) => id === instrument)?.label;
  return (
    <>
      <span role="status" className="sr-only">{loading ? `Loading ${label} samples` : ''}</span>
      <Select value={instrument} onValueChange={(value) => isInstrumentId(value) && setInstrument(value)}>
        <SelectTrigger size="sm" className="w-28" aria-label="Instrument" aria-busy={loading}>
          <SelectValue>{loading ? 'Loading…' : undefined}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {INSTRUMENTS.map(({ id, label }) => (
            <SelectItem key={id} value={id}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
