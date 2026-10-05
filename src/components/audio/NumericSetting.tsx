import { useState } from 'react';

/** Preserve invalid drafts while editing, but reflect committed settings before the next paint. */
export function NumericSetting({ value, min, max, step = 1, onChange }: {
  value: number; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  const [committed, setCommitted] = useState(value);
  const [draft, setDraft] = useState(String(value));
  if (committed !== value) { setCommitted(value); setDraft(String(value)); }
  return <input className="min-w-0 w-full rounded-md border border-input bg-background px-3 py-2 text-body tabular-nums text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    type="number" min={min} max={max} step={step} value={draft}
    onChange={event => {
      const text = event.target.value;
      setDraft(text);
      const number = Number(text);
      if (text.trim() !== '' && Number.isFinite(number) && number >= min && number <= max) onChange(number);
    }}
    onBlur={() => setDraft(String(value))} />;
}
