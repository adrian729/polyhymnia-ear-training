import { Link } from '@tanstack/react-router';
import { LOGO_URL } from '@/lib/logo';

export function ExerciseMasthead() {
  return (
    <Link
      to="/"
      className="rubricated font-specimen inline-flex items-center gap-2.5 self-start rounded-sm text-subhead text-muted-foreground outline-none transition-colors hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <img src={LOGO_URL} alt="" width={706} height={735} className="h-7 w-auto shrink-0" />
      <span>Index</span>
      <span aria-hidden="true">–</span>
      <span>Polyhymnia</span>
    </Link>
  );
}
