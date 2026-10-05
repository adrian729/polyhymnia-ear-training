import { useEffect, useState, type ReactNode } from 'react';
import { Check, CircleHelp, Infinity, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  normalizeQuestionCount,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  RANGE_TOKENS,
  TEMPO_NOTE_DURATION,
  TEMPOS,
  type RangeSearch,
  type SessionSearch,
  type Tempo,
} from '@/exercises/shared';

const COUNT_PRESETS = ['10', '20', '30', '50'] as const;
const TEMPO_TITLE: Record<Tempo, string> = { slow: 'Slow', medium: 'Medium', fast: 'Fast' };

type QuestionsSearch = Pick<SessionSearch, 'count' | 'endless' | 'auto'>;

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-base">
      <div className="flex flex-wrap items-baseline justify-between gap-x-base gap-y-tight border-b border-border pb-tight">
        <h2 className="font-display text-subhead">{title}</h2>
        {action}
      </div>
      <p className="-mt-2 max-w-[64ch] text-body text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function SetChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-meta font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        active ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-meta font-semibold uppercase tracking-wider text-primary-strong">{children}</h3>;
}

export function HelpPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className="flex max-h-[min(80dvh,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto text-meta leading-relaxed"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function HelpItem({ term, text }: { term: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
      <span className="font-medium">{term}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

export function OptionCard({
  kind,
  checked,
  title,
  text,
  onSelect,
}: {
  kind: 'checkbox' | 'radio';
  checked: boolean;
  title: string;
  text: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={kind}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        checked ? 'border-primary-strong bg-primary/10' : 'border-border hover:bg-muted',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center border transition-colors',
          kind === 'radio' ? 'rounded-full' : 'rounded-[4px]',
          checked ? 'border-primary-strong bg-primary-strong text-primary-foreground' : 'border-input bg-background',
        )}
      >
        {checked &&
          (kind === 'radio' ? (
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          ) : (
            <Check className="size-3" />
          ))}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-meta font-medium">{title}</span>
        <span className="text-meta leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

export function TempoSection({ tempo, onSelect }: { tempo: Tempo; onSelect: (tempo: Tempo) => void }) {
  return (
    <Section title="Tempo" description="How long each note sounds.">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1" role="radiogroup" aria-label="Tempo">
        {TEMPOS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === tempo}
            onClick={() => onSelect(option)}
            className={cn(
              'flex flex-col items-center rounded-md px-2 py-1.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              option === tempo ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            <span className="text-meta font-medium">{TEMPO_TITLE[option]}</span>
            <span className={cn('text-meta tabular-nums', option === tempo ? 'opacity-80' : 'text-muted-foreground')}>
              {TEMPO_NOTE_DURATION[option]} s
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

export function RangeSection({
  search,
  description,
  update,
}: {
  search: RangeSearch;
  description: string;
  update: (patch: Partial<RangeSearch>) => void;
}) {
  return (
    <Section title="Range" description={description}>
      <div className="grid grid-cols-2 gap-3">
        {(['low', 'high'] as const).map((end) => (
          <div key={end} className="flex flex-col gap-1.5">
            <label id={`range-${end}`} className="text-meta font-medium text-muted-foreground">
              {end === 'low' ? 'Lowest note' : 'Highest note'}
            </label>
            <Select value={search[end]} onValueChange={(value) => update({ [end]: value })}>
              <SelectTrigger className="w-full" aria-labelledby={`range-${end}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_TOKENS.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function QuestionsSection({
  search,
  update,
}: {
  search: QuestionsSearch;
  update: (patch: Partial<QuestionsSearch>) => void;
}) {
  const [countText, setCountText] = useState(search.count);
  const countValue = Number(search.count);
  const endless = search.endless === '1';

  useEffect(() => {
    setCountText(search.count);
  }, [search.count]);

  const commitCount = () => {
    const n = Number(countText);
    const next = Number.isFinite(n) ? String(normalizeQuestionCount(n)) : search.count;
    setCountText(next);
    if (next !== search.count) update({ count: next });
  };

  return (
    <Section title="Questions" description="How long the session lasts and what happens after a correct answer.">
      <div className="flex flex-col gap-3">
        <SubHeading>Number of questions</SubHeading>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div
            className={cn(
              'flex h-10 items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50',
              endless && 'opacity-50',
            )}
          >
            <button
              type="button"
              aria-label="One question fewer"
              disabled={endless || countValue <= QUESTION_COUNT_MIN}
              onClick={() => update({ count: String(normalizeQuestionCount(countValue - 1)) })}
              className="flex w-10 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <input
              id="question-count"
              type="text"
              inputMode="numeric"
              aria-label="Number of questions"
              aria-describedby="question-count-help"
              disabled={endless}
              value={endless ? '∞' : countText}
              onChange={(e) => setCountText(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={commitCount}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="w-14 border-x border-input bg-transparent text-center text-body font-semibold tabular-nums outline-none"
            />
            <button
              type="button"
              aria-label="One question more"
              disabled={endless || countValue >= QUESTION_COUNT_MAX}
              onClick={() => update({ count: String(normalizeQuestionCount(countValue + 1)) })}
              className="flex w-10 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick picks">
            {COUNT_PRESETS.map((preset) => (
              <SetChip
                key={preset}
                active={!endless && search.count === preset}
                onClick={() => update({ endless: '0', count: preset })}
              >
                {preset}
              </SetChip>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            <SetChip active={endless} onClick={() => update({ endless: endless ? '0' : '1' })}>
              <Infinity className="size-3.5" />
              Endless
            </SetChip>
          </div>
        </div>
        <p id="question-count-help" className="min-h-[2lh] text-meta text-muted-foreground sm:min-h-0">
          {endless
            ? 'No question limit. Keep going until you press Finish.'
            : `The session ends after ${countValue} question${countValue === 1 ? '' : 's'} and shows your score. Any number from ${QUESTION_COUNT_MIN} to ${QUESTION_COUNT_MAX}.`}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <SubHeading>After a correct answer</SubHeading>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="After a correct answer">
          <OptionCard
            kind="radio"
            checked={search.auto !== '1'}
            title="Wait for me"
            text="Stay on the answer until you press Next question."
            onSelect={() => update({ auto: '0' })}
          />
          <OptionCard
            kind="radio"
            checked={search.auto === '1'}
            title="Continue automatically"
            text="The next question starts after a short pause. Press Stay to remain on the answer."
            onSelect={() => update({ auto: '1' })}
          />
        </div>
      </div>
    </Section>
  );
}
