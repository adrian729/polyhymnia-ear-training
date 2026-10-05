import type { ReactNode } from 'react';
import { CircleCheck, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Ornament, OrnamentRule } from '@/components/Ornament';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';

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
        <Button variant="ghost" size="icon-sm" aria-label={ariaLabel}>
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
        <Button variant="ghost" size="icon-xs" aria-label={ariaLabel}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col text-meta leading-relaxed">
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
        <Ornament name="headpiece" className="mx-auto h-14 w-44 text-primary-strong" />
      ) : (
        <OrnamentRule name="gothic-leaf" />
      )}
      <div className="flex items-center gap-1">
        <Ornament name="fleur-de-lis" className="mr-1.5 size-5 text-primary-strong" />
        <h2 className="rubricated font-display text-subhead text-primary-strong">{title}</h2>
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
    'flex flex-col items-start gap-0.5 border-b pb-1.5 text-body transition-colors',
    result?.passed ? 'border-success/60' : 'border-rubric/50 hover:border-rubric',
  );
  const children = (
    <>
      <span
        className={cn(
          'flex items-center gap-1.5 font-medium',
          result?.passed ? 'text-success-strong' : 'text-rubric-strong hover:text-primary-strong',
        )}
      >
        {title}
        {result?.passed && <CircleCheck className="size-4 text-success-strong" aria-hidden />}
      </span>
      <span className={cn('text-meta', result?.passed ? 'font-medium text-success-strong' : 'text-muted-foreground')}>
        {result ? `Best: ${result.bestPercent.toFixed(1)}%${result.passed ? ' — passed' : ''}` : 'Not attempted'}
      </span>
    </>
  );
  return render(className, children);
}
