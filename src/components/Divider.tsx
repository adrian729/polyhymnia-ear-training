import type { CSSProperties } from 'react';
import { imageSet, type DividerAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';

/**
 * A repeating border used as a divider. The tile draws as a background so it repeats along the strip,
 * at the thickness its selection entry declares (a second one from the `sm` breakpoint up), from
 * copies sized for that thickness and the screen's density. Decorative, so it is hidden from
 * assistive tech.
 */
export function Divider({ asset, orientation = 'horizontal', className }: {
  asset: DividerAsset;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  const [narrow, wide = narrow] = asset.copies;
  const style = {
    '--divider-tile': imageSet(narrow[orientation]),
    '--divider-tile-wide': imageSet(wide[orientation]),
    '--divider-thickness': `${narrow.thickness}px`,
    '--divider-thickness-wide': `${wide.thickness}px`,
  } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-repeat [background-image:var(--divider-tile)] sm:[background-image:var(--divider-tile-wide)]',
        orientation === 'horizontal'
          ? 'h-[var(--divider-thickness)] w-full bg-[length:auto_var(--divider-thickness)] sm:h-[var(--divider-thickness-wide)] sm:bg-[length:auto_var(--divider-thickness-wide)]'
          : 'h-full w-[var(--divider-thickness)] bg-[length:var(--divider-thickness)_auto] sm:w-[var(--divider-thickness-wide)] sm:bg-[length:var(--divider-thickness-wide)_auto]',
        className,
      )}
      style={style}
    />
  );
}
