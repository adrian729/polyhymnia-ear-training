import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ExerciseMasthead } from './ExerciseMasthead';
import { PaperSheet } from '@/components/PaperSheet';

export interface TocModule {
  id: string;
  title: string;
}

const ROMAN = [
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
  'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx',
] as const;

/* A module counts as current once its heading has risen this far into the
   viewport, so an anchor jump and a slow scroll both settle on the section the
   reader is actually looking at. */
const HEADING_BAND = 100;

function useActiveModule(modules: readonly TocModule[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(() => modules[0]?.id);
  useEffect(() => {
    const last = modules[modules.length - 1];
    if (!last) return;
    const scroller = document.getElementById(modules[0].id)?.closest<HTMLElement>('[data-workshop-main]');
    if (!scroller) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (scroller.clientHeight + scroller.scrollTop >= scroller.scrollHeight - 2) {
        setActive(last.id);
        return;
      }
      let current = modules[0].id;
      const headingBand = scroller.getBoundingClientRect().top + HEADING_BAND;
      for (const module of modules) {
        const heading = document.getElementById(module.id);
        if (heading && heading.getBoundingClientRect().top <= headingBand) current = module.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };
    measure();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [modules]);
  return active;
}

function TocList({ modules, active }: { modules: readonly TocModule[]; active: string | undefined }) {
  return (
    <ol className="flex flex-col">
      {modules.map((module, i) => {
        const isActive = module.id === active;
        const [family, variant] = module.title.split(' — ');
        return (
          <li key={module.id}>
            <a
              href={`#${module.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'flex items-baseline gap-1.5 border-b border-border/60 py-1.5 text-meta leading-snug transition-colors hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive ? 'text-rubric-strong' : 'text-muted-foreground',
              )}
            >
              <span aria-hidden className="rubricated font-specimen shrink-0 tabular-nums">
                {ROMAN[i] ?? i + 1}
              </span>
              <span className="rubricated">
                {family}
                {variant && <span className="text-muted-foreground"> — {variant}</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function WorkshopAside({ modules }: { modules: readonly TocModule[] }) {
  const active = useActiveModule(modules);
  const list: ReactNode | null =
    modules.length === 0 ? null : <TocList modules={modules} active={active} />;
  return (
    <aside className="workshop-pane workshop-sidebar" aria-label="Exercise contents" tabIndex={0}>
      <PaperSheet paper="rag" size="sidebar" className="flex flex-col gap-base py-base">
        <nav aria-label="Breadcrumb">
          <ExerciseMasthead />
        </nav>

        {list && (
          <details className="lg:hidden">
            <summary className="rubricated font-specimen cursor-pointer text-subhead text-muted-foreground">Contents</summary>
            <div className="pt-tight">{list}</div>
          </details>
        )}

        {list && (
          <div className="hidden pb-base lg:block">
            <p className="rubricated font-specimen border-b border-border pb-tight text-subhead text-muted-foreground">Contents</p>
            {list}
          </div>
        )}
      </PaperSheet>
    </aside>
  );
}
