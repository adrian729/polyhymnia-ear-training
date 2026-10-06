import { Link } from '@tanstack/react-router';
import { LOGO } from '@/lib/logo';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { PolyhymniaName } from '../PolyhymniaName';

export function ExerciseMasthead() {
  return (
    <Link
      to="/"
      aria-label="Index – Polyhymnia"
      className="group rubricated font-specimen inline-flex items-center gap-2.5 self-start rounded-sm text-subhead text-muted-foreground outline-none transition-colors hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <ResponsiveImage {...LOGO} placement="above-fold" sizes="calc(1.75rem * 706 / 735)" alt="" width={706} height={735} className="h-7 w-auto shrink-0" />
      <span>Index</span>
      <span aria-hidden="true">–</span>
      <PolyhymniaName className="transition-colors group-hover:text-primary-strong" />
    </Link>
  );
}
