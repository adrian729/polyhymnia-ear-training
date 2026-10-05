import { Link } from '@tanstack/react-router';
import type { EXERCISE_GROUPS } from '@/exercises/groups';
import { TitleText } from './Initial';

type Group = typeof EXERCISE_GROUPS[number];
type IndexEntry = (Group | Group['exercises'][number]) & { id?: string };

export function ExerciseIndexList({ entries }: { entries: readonly IndexEntry[] }) {
  return (
    <ol className="-my-base flex flex-col divide-y divide-border/60">
      {entries.map((entry, index) => (
        <li key={entry.to} id={entry.id} className="scroll-mt-base">
          <Link
            to={entry.to}
            className="group flex cursor-pointer gap-base py-base transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          >
            <span
              aria-hidden="true"
              className="rubricated font-specimen shrink-0 text-subhead text-muted-foreground transition-colors group-hover:text-primary-strong"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex min-w-0 flex-col gap-tight">
              <h3 aria-label={entry.title} className="font-display text-heading text-primary-strong">
                <TitleText title={entry.title} />
              </h3>
              <span className="max-w-[64ch] text-body text-muted-foreground">{entry.description}</span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
