import type { ReactNode } from 'react';
import { CircleCheck, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { imageAsset } from '@/lib/assets';
import { OrnamentImage } from '@/components/OrnamentImage';
import decorations from '@/generated/assets/decorations';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';

const HEADPIECE = imageAsset(decorations, 'acanthus-headpiece');
const MODULE_SPRIG = imageAsset(decorations, 'acanthus-module-sprig');
const FLOURISH = imageAsset(decorations, 'acanthus-horizontal-flourish');

export function OverviewHelpPopover({
  ariaLabel,
  sections,
}: {
  ariaLabel: string;
  sections: readonly OverviewSection[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="size-11 shrink-0" aria-label={ariaLabel}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex max-h-[70vh] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-y-auto text-meta leading-relaxed"
      >
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
            <h3 className="font-display text-meta font-semibold uppercase tracking-wider text-primary-strong">
              {section.heading}
            </h3>
            <p>{section.intro}</p>
            {section.items.length > 0 && (
              <dl className="mt-1 flex flex-col gap-3 border-l-2 border-border pl-3">
                {section.items.map((item) => (
                  <div key={item.term} className="flex flex-col gap-0.5">
                    <dt className="font-medium">{item.term}</dt>
                    <dd className="text-muted-foreground">{item.text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ModuleHelpPopover({ ariaLabel, help }: { ariaLabel: string; help: readonly HelpSection[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="size-11 shrink-0" aria-label={ariaLabel}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-y-auto text-meta leading-relaxed">
        {help.map((section) => (
          <section key={section.heading} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
            <h3 className="font-display text-meta font-semibold uppercase tracking-wider text-primary-strong">
              {section.heading}
            </h3>
            <p>{section.text}</p>
          </section>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ModuleCard({
  id,
  title,
  help,
  lead = false,
  children,
}: {
  id: string;
  title: string;
  help: readonly HelpSection[];
  lead?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-base flex-col gap-base">
      {lead ? (
        <OrnamentImage asset={HEADPIECE} sizes="11rem" placement="above-fold" className="mx-auto h-auto w-44" />
      ) : (
        <OrnamentImage asset={FLOURISH} sizes="(min-width: 40rem) 7rem, 6rem" placement="below-fold" className="mx-auto h-auto w-24 sm:w-28" />
      )}
      <div className="flex items-start gap-tight text-start">
        <OrnamentImage asset={MODULE_SPRIG} sizes="1.5rem" placement={lead ? 'above-fold' : 'below-fold'} className="mt-1 h-auto w-6 shrink-0" />
        <h2 className="rubricated min-w-0 font-display text-subhead text-primary-strong">{title}</h2>
        <ModuleHelpPopover ariaLabel={`About ${title}`} help={help} />
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function LessonLinkTile({
  title,
  result,
  render,
}: {
  title: string;
  result: LessonResult | undefined;
  render: (className: string, children: ReactNode) => ReactNode;
}) {
  const className = cn(
    'group/lesson flex min-h-14 flex-col items-start gap-0.5 border-b px-tight py-2 text-start text-body transition-colors hover:bg-rubric/5 focus-visible:bg-rubric/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 disabled:hover:bg-transparent sm:flex-row sm:items-center sm:justify-between sm:gap-base',
    result?.passed ? 'border-success/60' : 'border-rubric/50 hover:border-rubric',
  );
  const children = (
    <>
      <span
        className={cn(
          'flex min-w-0 items-center gap-1.5 font-medium',
          result?.passed ? 'text-success-strong' : 'text-rubric-strong group-hover/lesson:text-primary-strong',
        )}
      >
        {title}
        {result?.passed && <CircleCheck className="size-4 shrink-0 text-success-strong" aria-hidden />}
      </span>
      <span className={cn('text-meta sm:shrink-0 sm:text-right', result?.passed ? 'font-medium text-success-strong' : 'text-muted-foreground')}>
        {result ? `Best: ${result.bestPercent.toFixed(1)}%${result.passed ? ' — passed' : ''}` : 'Not attempted'}
      </span>
    </>
  );
  return render(className, children);
}
