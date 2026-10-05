import { Button } from '@/components/ui/button';
import type { useMicrophone } from '@/lib/useMicrophone';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MicrophoneButton({ enabled, preparing, onToggle, disabled = false, label = 'Enable microphone' }: {
  enabled: boolean; preparing: boolean; onToggle: () => void; disabled?: boolean; label?: string;
}) {
  const Icon = enabled ? Mic : MicOff;
  const captions = [label, 'Cancel microphone', 'Microphone enabled'];
  const selected = preparing ? 1 : enabled ? 2 : 0;
  return <Button type="button" variant="outline" aria-pressed={enabled} disabled={disabled}
    title={enabled ? 'Disable microphone' : undefined} onClick={onToggle}
    className={cn('rubricated font-specimen self-start gap-tight text-meta font-normal transition-none',
      enabled && 'border-rubric bg-rubric text-rubric-foreground hover:bg-rubric-strong hover:text-rubric-foreground active:bg-rubric-strong focus-visible:border-rubric-strong focus-visible:ring-rubric-strong/50 dark:border-rubric dark:bg-rubric dark:hover:bg-rubric-strong')}>
    <Icon aria-hidden="true" className="size-5 shrink-0" />
    <span className="grid">
      {captions.map((caption, index) => <span key={index} aria-hidden={index !== selected}
        className={cn('col-start-1 row-start-1', index !== selected && 'invisible')}>{caption}</span>)}
    </span>
  </Button>;
}

export function MicrophoneControl({ microphone, busy = false, label = 'Enable microphone' }: {
  microphone: ReturnType<typeof useMicrophone>; busy?: boolean; label?: string;
}) {
  return <div data-microphone-control className="flex flex-col gap-tight">
    <MicrophoneButton enabled={!!microphone.resource} preparing={microphone.preparing} label={label}
      disabled={busy && !microphone.resource && !microphone.preparing}
      onToggle={() => { if (microphone.resource || microphone.preparing) microphone.disable(); else void microphone.activate(); }} />
    {microphone.error && <p role="alert" className="text-meta text-destructive">{microphone.error}</p>}
  </div>;
}
