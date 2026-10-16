import { Link } from '@tanstack/react-router';
import type { ExerciseGroup } from '@/exercises/groups';
import type { Exercise } from '@/exercises/navigation';
import { imageAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import decorations from '@/generated/assets/decorations';
import { TitleText } from './Initial';
import { OrnamentImage } from './OrnamentImage';

type IndexEntry = ExerciseGroup | Exercise;

const FLOURISH = imageAsset(decorations, 'acanthus-horizontal-flourish');
const ROSETTE = imageAsset(decorations, 'acanthus-rosette');

/** `flourishes` separates the entries with the acanthus flourish and rosette, alternating, instead of a hairline. */
export function ExerciseIndexList({ entries, flourishes = false }: { entries: readonly IndexEntry[]; flourishes?: boolean }) {
  return (
    <ol className={cn('-my-base flex flex-col', !flourishes && 'divide-y divide-border/60')}>
      {entries.map((entry, index) => (
        <li key={entry.to} id={entry.id} className="scroll-mt-base">
          {flourishes && index > 0 && (index % 2 === 1
            ? <OrnamentImage asset={FLOURISH} sizes="(min-width: 40rem) 7rem, 6rem" placement="below-fold" className="mx-auto h-auto w-24 sm:w-28" />
            : <OrnamentImage asset={ROSETTE} sizes="(min-width: 40rem) 2.5rem, 2.25rem" placement="below-fold" className="mx-auto h-auto w-9 sm:w-10" />)}
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
