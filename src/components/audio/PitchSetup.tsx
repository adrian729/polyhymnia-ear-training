import { HelpPopover } from '@/components/custom/CustomParts';
import { MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEFAULT_PITCH_SETTINGS, selectVocalRange, VOCAL_NOTES, VOCAL_RANGES, type VocalRangeKind, type PitchSettings } from '@/exercises/pitch-matching/settings';
import { noteName } from '@/exercises/pitch-matching/match';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExerciseMicrophone } from './MicrophoneProvider';
import { MicrophoneControl } from './MicrophoneControl';
import { NumericSetting } from './NumericSetting';

export function PitchSetup({ value, onChange, microphoneRequirementId }: { value: PitchSettings; onChange: (value: PitchSettings) => void; microphoneRequirementId?: string }) {
  const microphone = useExerciseMicrophone();
  return <fieldset className="@container flex min-w-0 flex-col gap-base">
    <legend className="mb-base w-full border-b border-border pb-tight">
      <span className="flex items-center gap-tight">
        <span className="font-display text-subhead">Pitch settings</span>
        <HelpPopover label="About pitch settings">
          <div className="flex flex-col gap-base">
            <p>Off by default. Enable here before starting a pitch exercise; your browser will ask for access. Click the blue enabled button to turn it off. Activation carries into pitch practice and resets when you leave Pitch, reload or hide the page. Settings are saved; activation is not.</p>
            <p>Choose a voice range as a starting point, then adjust the lowest and highest notes to your comfortable range. Changing notes keeps your selected voice type; selecting a different preset replaces both limits. Custom keeps your current limits. Every exercise target stays within the chosen range, including both endpoints. One-note ranges are allowed.</p>
            <p>Presets follow <a href="https://yalelibrary.atlassian.net/wiki/spaces/YMD/pages/202030334" target="_blank" rel="noreferrer" className="text-rubric-strong underline">Yale Library’s vocal-range guide</a>. Voice types are approximate conventions, and your own comfortable range may differ. Note choices cover C2–F6; C4 is middle C.</p>
            <dl className="flex flex-col gap-tight">
              <dt className="font-semibold">Minimum sound level (RMS)</dt>
              <dd>Lower detects quieter singing; higher rejects more background noise. This is normalized signal level, not microphone gain.</dd>
              <dt className="font-semibold">Minimum pitch clarity</dt>
              <dd>Higher requires a more reliable single pitch; lower accepts more uncertain sound. Too low can produce incorrect notes. Clarity is a detector score, not a probability.</dd>
            </dl>
            <p>Use headphones and sing or hum one note at a time. Detection covers 65–1500 Hz. Reference playback cannot count toward a match. Audio is analyzed on your device without recording or uploads.</p>
          </div>
        </HelpPopover>
      </span>
    </legend>
    <section aria-label="Vocal range" className="flex min-w-0 flex-col gap-base">
      <div className="grid gap-base @min-[28rem]:grid-cols-[2fr_3fr]">
        <label className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">Voice range
          <Select value={value.rangeKind} onValueChange={kind => onChange(selectVocalRange(value, kind as VocalRangeKind))}>
            <SelectTrigger className="w-full" aria-label="Voice range"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              {VOCAL_RANGES.map(range => <SelectItem key={range.id} value={range.id}>{range.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <div className="grid min-w-0 grid-cols-2 gap-base">{(['low', 'high'] as const).map(end => <label key={end} className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">
          {end === 'low' ? 'Lowest note' : 'Highest note'}
          <Select value={String(value[end])} onValueChange={note => onChange({ ...value, [end]: Number(note) })}>
            <SelectTrigger className="w-full" aria-label={end === 'low' ? 'Lowest note' : 'Highest note'}><SelectValue /></SelectTrigger>
            <SelectContent>
              {VOCAL_NOTES.filter(note => end === 'low' ? note <= value.high : note >= value.low)
                .map(note => <SelectItem key={note} value={String(note)}>{noteName(note)}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>)}</div>
      </div>
      {value.rangeKind !== 'custom' && <Button type="button" variant="outline"
        className="rubricated font-specimen self-start text-meta font-normal transition-colors duration-fast"
        disabled={VOCAL_RANGES.some(range => range.id === value.rangeKind && range.low === value.low && range.high === value.high)}
        onClick={() => onChange(selectVocalRange(value, value.rangeKind))}>Reset range to preset</Button>}
    </section>
    <section id={microphoneRequirementId} aria-label="Pitch microphone"
      className={cn('flex min-w-0 flex-col gap-base', microphone.resource
        ? 'border-t border-border pt-base'
        : 'rounded border border-border bg-surface-raised p-base text-foreground')}>
      {!microphone.resource && <h3 className="flex items-center gap-tight font-display text-subhead font-semibold">
        <MicOff aria-hidden="true" className="size-5 shrink-0" />Microphone required to start
      </h3>}
      <MicrophoneControl microphone={microphone} />
      {microphone.resource && <>
        <div className="grid gap-base @min-[28rem]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">Minimum sound level (RMS)
            <NumericSetting min={0.001} max={0.2} step={0.001} value={value.minimumRms}
              onChange={minimumRms => onChange({ ...value, minimumRms })} />
          </label>
          <label className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">Minimum pitch clarity
            <NumericSetting min={0.5} max={0.99} step={0.01} value={value.minimumClarity}
              onChange={minimumClarity => onChange({ ...value, minimumClarity })} />
          </label>
        </div>
        <Button type="button" variant="outline" className="rubricated font-specimen self-start text-meta font-normal transition-colors duration-fast"
          onClick={() => onChange({ ...value, minimumRms: DEFAULT_PITCH_SETTINGS.minimumRms, minimumClarity: DEFAULT_PITCH_SETTINGS.minimumClarity })}>Reset microphone settings</Button>
      </>}
    </section>
  </fieldset>;
}
