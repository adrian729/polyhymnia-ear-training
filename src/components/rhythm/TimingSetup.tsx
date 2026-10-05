import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Play, Square } from 'lucide-react';
import type { RhythmPlaybackHandle } from '@polyhymnia/rhythm/browser';
import { Button } from '@/components/ui/button';
import { HelpPopover } from '@/components/custom/CustomParts';
import { DEFAULT_TIMING, type TimingPreferences } from '@/exercises/shared/rhythm/store';
import { MicrophoneControl } from '@/components/audio/MicrophoneControl';
import { useExerciseMicrophone } from '@/components/audio/MicrophoneProvider';
import { NumericSetting } from '@/components/audio/NumericSetting';
import { createRhythmSound } from '@/lib/rhythmSound';
import { cn } from '@/lib/utils';

const PREVIEW_CLASS = 'rubricated font-specimen h-9 w-full text-meta';

function MetronomePreview({ volume, bpm }: { volume: number; bpm: number }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string>();
  const current = useRef<{ abort: AbortController; handle?: RhythmPlaybackHandle } | undefined>(undefined);
  const stop = () => { current.current?.abort.abort(); current.current?.handle?.stop(); current.current = undefined; };
  useEffect(() => { setPlaying(false); setError(undefined); return stop; }, [volume, bpm]);
  const preview = async () => {
    if (playing) { stop(); setPlaying(false); return; }
    const run = { abort: new AbortController(), handle: undefined as RhythmPlaybackHandle | undefined };
    current.current = run;
    setPlaying(true); setError(undefined);
    try {
      const sound = createRhythmSound(volume);
      await sound.prepare(run.abort.signal);
      if (run.abort.signal.aborted) return;
      run.handle = sound.play([0, 1, 2, 3].map((beat, index) => ({ atSeconds: beat * 60 / bpm, accent: index === 0, level: 'pulse' as const })),
        { durationSeconds: 3 * 60 / bpm + 0.035, leadSeconds: 0.05 });
      await run.handle.finished;
    } catch (reason) {
      if (current.current === run) setError(reason instanceof Error ? reason.message : 'Unable to preview the metronome.');
    } finally {
      if (current.current === run) { stop(); setPlaying(false); }
    }
  };
  return <div className="flex flex-col gap-tight">
    <Button type="button" variant="outline" className={PREVIEW_CLASS} aria-pressed={playing} onClick={() => { void preview(); }}>
      {playing ? <Square aria-hidden="true" /> : <Play aria-hidden="true" />}
      {playing ? 'Stop preview' : 'Preview metronome'}
    </Button>
    {error && <p role="alert" className="text-meta text-destructive">{error}</p>}
  </div>;
}

function TapPreview({ value }: { value: TimingPreferences }) {
  const sound = useMemo(() => createRhythmSound(0, value.feedbackSound, value.feedbackVolume), [value.feedbackSound, value.feedbackVolume]);
  const abort = useRef<AbortController | undefined>(undefined);
  const [error, setError] = useState<string>();
  useEffect(() => {
    const run = new AbortController(); abort.current = run; setError(undefined);
    return () => { run.abort(); sound.stopFeedback(); };
  }, [sound]);
  return <div className="flex flex-col gap-tight">
    <Button type="button" variant="outline" className={PREVIEW_CLASS} onClick={() => {
      setError(undefined);
      const run = abort.current; if (!run) return;
      void sound.feedbackTap(run.signal).catch(reason => {
        if (!run.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to preview the tap sound.');
      });
    }}><Play aria-hidden="true" />Preview tap sound</Button>
    {error && <p role="alert" className="text-meta text-destructive">{error}</p>}
  </div>;
}

export const CONTROL_CLASS = 'rounded-md border border-input bg-background px-3 py-2 text-body';
const SETTINGS_CONTROL_CLASS = cn(CONTROL_CLASS, 'min-w-0 w-full focus-visible:ring-2 focus-visible:ring-ring/50');
const LABEL_CLASS = 'flex min-w-0 flex-col gap-tight text-meta text-muted-foreground';
const INLINE_LABEL_CLASS = 'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-base text-meta text-muted-foreground';

function VolumeControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className={LABEL_CLASS}>
    <span className="flex items-baseline justify-between gap-tight">
      <span>Volume</span>
      <span className="font-specimen tabular-nums text-foreground">{Math.round(value * 100)}%</span>
    </span>
    <input aria-label={label} className="h-6 w-full cursor-pointer accent-primary-strong" type="range" min={0} max={1} step={0.05} value={value}
      onChange={e => onChange(Number(e.target.value))} />
  </label>;
}

export function TimingSetup({ value, onChange }: { value: TimingPreferences; onChange: (value: TimingPreferences) => void }) {
  const toleranceId = useId();
  const microphone = useExerciseMicrophone();
  const updateMicrophone = (settings: Partial<TimingPreferences['microphone']>) =>
    onChange({ ...value, microphone: { ...value.microphone, ...settings } });
  return <fieldset className="@container flex min-w-0 flex-col gap-tight">
    <legend className="mb-tight w-full border-b border-border pb-tight font-display text-subhead">Rhythm settings</legend>
    <div className="grid items-center gap-tight @min-[28rem]:grid-cols-2 @min-[28rem]:gap-x-base">
      <div className={cn(INLINE_LABEL_CLASS, '@max-[18rem]:grid-cols-1 @max-[18rem]:gap-tight')}>
        <div className="flex items-center gap-1">
          <label htmlFor={toleranceId}>Tolerance</label>
          <HelpPopover label="About tolerance">
            <p>Taps within this window before or after the beat count as on time. At faster tempos, the window may shrink to keep nearby beats separate.</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-base gap-y-tight">
              <dt className="font-medium">Relaxed</dt><dd>Up to ±120 ms</dd>
              <dt className="font-medium">Standard</dt><dd>Up to ±80 ms</dd>
              <dt className="font-medium">Strict</dt><dd>Up to ±40 ms</dd>
              <dt className="font-medium">Custom</dt><dd>±10–250 ms</dd>
            </dl>
          </HelpPopover>
        </div>
        <select id={toleranceId} className={cn(SETTINGS_CONTROL_CLASS, 'text-foreground')} value={value.tolerance} onChange={e => onChange({ ...value, tolerance: e.target.value as TimingPreferences['tolerance'] })}>
          <option value="relaxed">Relaxed</option><option value="standard">Standard</option><option value="strict">Strict</option><option value="custom">Custom</option>
        </select>
      </div>
      {value.tolerance === 'custom' && <label className={INLINE_LABEL_CLASS}>Window ±ms
        <NumericSetting min={10} max={250} value={value.customMs}
          onChange={customMs => onChange({ ...value, customMs })} />
      </label>}
    </div>
    <div className="grid gap-tight @min-[28rem]:grid-cols-2 @min-[28rem]:gap-x-base">
      <section aria-label="Metronome" className="flex min-w-0 flex-col gap-tight rounded-lg border border-border px-base py-3">
        <h3 className="rubricated font-specimen text-subhead text-primary-strong">Metronome</h3>
        <p className="flex flex-1 items-center text-meta text-muted-foreground">Hear four beats at 90 BPM.</p>
        <VolumeControl label="Metronome volume" value={value.volume} onChange={volume => onChange({ ...value, volume })} />
        <MetronomePreview volume={value.volume} bpm={90} />
      </section>
      <section aria-label="Tap feedback" className="flex min-w-0 flex-col gap-tight rounded-lg border border-border px-base py-3">
        <h3 className="rubricated font-specimen text-subhead text-primary-strong">Tap feedback</h3>
        <label className={cn(INLINE_LABEL_CLASS, '@max-[18rem]:grid-cols-1 @max-[18rem]:gap-tight')}>Tap sound
          <select className={cn(SETTINGS_CONTROL_CLASS, 'text-foreground')} value={value.feedbackSound} onChange={e => onChange({ ...value, feedbackSound: e.target.value as TimingPreferences['feedbackSound'] })}>
            <option value="woodblock">Woodblock</option><option value="kick">Kick drum</option><option value="snare">Snare drum</option>
          </select>
        </label>
        <VolumeControl label="Tap volume" value={value.feedbackVolume} onChange={feedbackVolume => onChange({ ...value, feedbackVolume })} />
        <TapPreview value={value} />
      </section>
    </div>
    <p className="text-meta text-muted-foreground">Press Space or click / touch the pad during practice. Both inputs are always available.</p>
    <section aria-label="Microphone claps" className="flex min-w-0 flex-col gap-base rounded border border-border p-base">
      <div className="flex flex-wrap items-start gap-tight">
        <MicrophoneControl microphone={microphone} label="Enable microphone claps" />
        <HelpPopover label="About microphone claps">
          <div className="flex flex-col gap-base">
            <p>Microphone input is off by default. Enable it here before starting a timed exercise; your browser will ask for access. Activation carries into timed Rhythm exercises and resets when you leave, reload, hide the page, or finish practice. Your settings are saved; activation is not.</p>
            <p>Use headphones. Other sharp sounds, noisy keys and speaker playback may count as claps. Tap feedback is muted in practice while the microphone is enabled. Clap sessions show results but do not update saved lesson progress while microphone timing is being evaluated.</p>
            <dl className="flex flex-col gap-tight">
              <dt className="font-semibold">Minimum sound level (RMS)</dt>
              <dd>Lower detects quieter sounds; higher rejects more background noise. This is normalized signal level, not microphone gain.</dd>
              <dt className="font-semibold">Required sound rise (ratio)</dt>
              <dd>Lower accepts softer attacks; higher requires a sharper rise above recent sound levels.</dd>
              <dt className="font-semibold">Minimum gap between claps (ms)</dt>
              <dd>Higher helps reject echoes but can miss closely spaced claps.</dd>
              <dt className="font-semibold">Microphone timing adjustment (ms)</dt>
              <dd>Leave at zero unless you have measured a stable input delay. Shifts microphone hits earlier without widening tolerance. Changing lag cannot be corrected by this adjustment.</dd>
            </dl>
            <p>Click/touch and Space remain available. Audio is analyzed on your device without recording or uploads.</p>
          </div>
        </HelpPopover>
      </div>
      {microphone.resource && <>
        <div className="grid gap-base @min-[28rem]:grid-cols-2">
          <label className={LABEL_CLASS}>Minimum sound level (RMS)
            <NumericSetting min={0.001} max={0.2} step={0.001} value={value.microphone.minimumRms}
              onChange={minimumRms => updateMicrophone({ minimumRms })} />
          </label>
          <label className={LABEL_CLASS}>Required sound rise (ratio)
            <NumericSetting min={1.1} max={10} step={0.1} value={value.microphone.riseRatio}
              onChange={riseRatio => updateMicrophone({ riseRatio })} />
          </label>
          <label className={LABEL_CLASS}>Minimum gap between claps (ms)
            <NumericSetting min={20} max={500} step={5} value={value.microphone.minimumSpacingMs}
              onChange={minimumSpacingMs => updateMicrophone({ minimumSpacingMs })} />
          </label>
          <label className={LABEL_CLASS}>Microphone timing adjustment (ms)
            <NumericSetting min={0} max={250} step={5} value={value.microphone.offsetMs}
              onChange={offsetMs => updateMicrophone({ offsetMs })} />
          </label>
        </div>
        <Button type="button" variant="outline" className="rubricated font-specimen self-start text-meta font-normal transition-colors duration-fast"
          onClick={() => onChange({ ...value, microphone: { ...DEFAULT_TIMING.microphone } })}>Reset microphone settings</Button>
      </>}
    </section>
    <details className="group border-t border-border pt-tight">
      <summary className="rubricated font-specimen flex cursor-pointer list-none items-center justify-between gap-base text-meta text-primary-strong [&::-webkit-details-marker]:hidden">
        Optional timing adjustment
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-fast group-open:rotate-180" />
      </summary>
      <div className="mt-base flex flex-col gap-base">
        <p className="max-w-[65ch] text-meta text-muted-foreground">Start at zero. Use 0–250 ms only to compensate for system lag, not early or late playing. This shifts recorded taps earlier once, without widening tolerance.</p>
        <div className="grid gap-base @min-[28rem]:grid-cols-2">
          {(['pointer', 'keyboard'] as const).map(method => <label key={method} className={LABEL_CLASS}>
            {method === 'pointer' ? 'Click / touch adjustment (ms)' : 'Space key adjustment (ms)'}
            <NumericSetting min={0} max={250} step={5} value={value.offsets[method]}
              onChange={offset => onChange({ ...value, offsets: { ...value.offsets, [method]: offset } })} />
          </label>)}
        </div>
        <Button type="button" variant="outline" className="rubricated font-specimen self-start text-meta" onClick={() => onChange({ ...value, offsets: { keyboard: 0, pointer: 0 } })}>Reset adjustments</Button>
        <p className="text-meta text-muted-foreground">Adjustment cannot correct changing lag. Recheck it when you change headphones, speakers, or input device. You can leave both at zero and skip this setup.</p>
      </div>
    </details>
  </fieldset>;
}
