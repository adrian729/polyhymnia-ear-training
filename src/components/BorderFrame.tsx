import type { CSSProperties, ReactNode } from 'react';
import { imageSet, type FrameAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';

/*
 * A painted border-image frame. The atlas (corners + one repeat per edge) draws with `round`, which
 * fits whole repeats and keeps each edge ending where its corners expect. The slice, the pixel-sized
 * copies and their densities all come from the design's catalog metadata (scripts/asset-manifest.ts);
 * only the drawn thicknesses are composition, taken from the same selection entry so they cannot
 * drift from the copies. A second thickness draws from the `sm` breakpoint up.
 */
export function BorderFrame({ asset, children, className }: { asset: FrameAsset; children: ReactNode; className?: string }) {
  const [narrow, wide = narrow] = asset.copies;
  const style = {
    '--border-frame-narrow': imageSet(narrow.images),
    '--border-frame-wide': imageSet(wide.images),
    '--border-frame-thickness': `${narrow.thickness}px`,
    '--border-frame-thickness-wide': `${wide.thickness}px`,
    '--border-frame-slice': (typeof asset.slicePercent === 'number' ? [asset.slicePercent] : asset.slicePercent).map(slice => `${slice}%`).join(' '),
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
