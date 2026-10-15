import type { CSSProperties, ReactNode } from 'react';
import type { FrameAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';

/*
 * A painted border-image frame. The atlas (corners + one repeat per edge) draws with `round`, which
 * fits whole repeats and keeps each edge ending where its corners expect. The slice, the pixel-sized
 * copies and their densities all come from the design's catalog metadata (scripts/asset-manifest.ts);
 * only the two drawn thicknesses are composition, taken from the same selection entry so they cannot
 * drift from the copies.
 *
 * -webkit-image-set() is image-set()'s legacy alias, which browsers must accept. Unprefixed
 * image-set() needs Chrome 113 or Safari 17, and an inline style gets no fallback from the CSS build.
 */
const imageSet = (copy: FrameAsset['copies'][number]) =>
  `-webkit-image-set(url("${copy['1x']}") 1x, url("${copy['2x']}") 2x, url("${copy['3x']}") 3x)`;

export function BorderFrame({ asset, children, className }: { asset: FrameAsset; children: ReactNode; className?: string }) {
  const narrow = asset.copies[0]!;
  const wide = asset.copies[1] ?? narrow;
  const style = {
    '--border-frame-narrow': imageSet(narrow),
    '--border-frame-wide': imageSet(wide),
    '--border-frame-thickness': `${narrow.thickness}px`,
    '--border-frame-thickness-wide': `${wide.thickness}px`,
    '--border-frame-slice': `${asset.slicePercent}%`,
  } as CSSProperties;
  return (
    <div
      className={cn(
        'border-solid border-transparent p-base',
        '[border-width:var(--border-frame-thickness)] [border-image-source:var(--border-frame-narrow)]',
        '[border-image-slice:var(--border-frame-slice)] [border-image-width:1] [border-image-repeat:round]',
        'sm:p-loose sm:[border-width:var(--border-frame-thickness-wide)] sm:[border-image-source:var(--border-frame-wide)]',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
