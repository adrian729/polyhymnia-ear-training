import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
// A painted Book of Hours border from the medieval-ornaments borders resource. Its atlas holds the
// four phase-matched corners and one repeat of each edge, so it draws as a CSS border image with
// `round`, which fits whole repeats and keeps every edge ending where its corners expect. The copies
// are sized at build time for each border width drawn (1.75rem, 2.5rem from 40rem up) at 1x, 2x and
// 3x. AVIF keeps the rosettes' fine colour, which WebP's half-resolution colour turns grey, and is
// smaller than WebP at the same size.
import narrow1x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=137&quality=60&format=avif';
import narrow2x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=274&quality=60&format=avif';
import narrow3x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=410&quality=60&format=avif';
import wide1x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=195&quality=60&format=avif';
import wide2x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=391&quality=60&format=avif';
import wide3x from '@ranx729/medieval-ornaments-assets-borders-001/webp/painted-rosette-and-fan-vine-border.webp?w=586&quality=60&format=avif';

// -webkit-image-set() is image-set()'s legacy alias, which browsers must accept. Unprefixed
// image-set() needs Chrome 113 or Safari 17, older than the build supports, and an inline style
// gets no fallback from the CSS build, so without the alias the frame would not draw there.
const imageSet = (x1: string, x2: string, x3: string) => `-webkit-image-set(url("${x1}") 1x, url("${x2}") 2x, url("${x3}") 3x)`;

const STYLE = {
  '--painted-frame-narrow': imageSet(narrow1x, narrow2x, narrow3x),
  '--painted-frame-wide': imageSet(wide1x, wide2x, wide3x),
  // The catalog's slice (141 of the 689px master), as a share so it holds for every copy.
  borderImageSlice: `${(141 / 689) * 100}%`,
  borderImageWidth: '1',
  borderImageRepeat: 'round',
} as CSSProperties;

export function PaintedFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-[1.75rem] border-solid border-transparent p-base [border-image-source:var(--painted-frame-narrow)]',
        'sm:border-[2.5rem] sm:p-loose sm:[border-image-source:var(--painted-frame-wide)]',
        className,
      )}
      style={STYLE}
    >
      {children}
    </div>
  );
}
