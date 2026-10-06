import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
// A painted Book of Hours border from the medieval-ornaments borders resource. Its atlas holds the
// four phase-matched corners and one repeat of each edge, so it draws as a CSS border image with
// `round`, which fits whole repeats and keeps every edge ending where its corners expect. The
// copies are sized at build time for 1x, 2x and 3x screens of the widest border drawn (2.5rem).
import rosette1x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=195&quality=82&format=webp';
import rosette2x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=391&quality=82&format=webp';
import rosette3x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=586&quality=82&format=webp';

// The catalog's slice (141 of the 689px master), as a share so it holds for every copy.
const SLICE = `${(141 / 689) * 100}%`;
const SOURCE = `image-set(url("${rosette1x}") 1x, url("${rosette2x}") 2x, url("${rosette3x}") 3x)`;

export function PaintedFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('border-[1.75rem] border-solid border-transparent p-base sm:border-[2.5rem] sm:p-loose', className)}
      style={{ borderImageSource: SOURCE, borderImageSlice: SLICE, borderImageWidth: '1', borderImageRepeat: 'round' }}
    >
      {children}
    </div>
  );
}
