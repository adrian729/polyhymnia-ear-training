import { cn } from '@/lib/utils';
import { Initial } from './Initial';

export function PolyhymniaName({ illuminated = false, className }: { illuminated?: boolean; className?: string }) {
  return (
    <span className={cn('text-wordmark', className)}>
      {illuminated ? <Initial letter="P" /> : <span className="text-primary-strong">P</span>}
      {'ol'}<span className="text-primary-strong">y</span>
      {'h'}<span className="text-primary-strong">y</span>{'mnia'}
    </span>
  );
}
