import { Initial } from './Initial';

export function PolyhymniaName({ illuminated = false }: { illuminated?: boolean }) {
  return (
    <span>
      {illuminated ? <Initial letter="P" /> : 'P'}
      {'ol'}<span className="text-primary-strong">y</span>
      {'h'}<span className="text-primary-strong">y</span>{'mnia'}
    </span>
  );
}
