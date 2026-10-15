import type { CSSProperties } from 'react';
import type { DividerAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';

/**
 * A repeating border used as a divider. The tile draws as a background so it repeats along the axis;
 * the rotated copy is the same artwork turned for the other direction. `thickness` is the drawn strip
 * width in rem. Decorative, so it is hidden from assistive tech.
 */
export function Divider({ asset, thickness, orientation = 'horizontal', className }: {
  asset: DividerAsset;
  /** The strip thickness in rem. */
  thickness: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  const horizontal = orientation === 'horizontal';
  const style = {
    '--divider-tile': `url("${horizontal ? asset.tile : asset.rotated}")`,
    '--divider-thickness': `${thickness}rem`,
  } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-repeat',
        // Horizontal: strip height is the thickness and it repeats left-to-right; vertical: mirrored.
        'h-[var(--divider-thickness)] w-full bg-[length:auto_var(--divider-thickness)] [background-image:var(--divider-tile)]',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[var(--divider-thickness)]',
        'data-[orientation=vertical]:bg-[length:var(--divider-thickness)_auto]',
        className,
      )}
      data-orientation={orientation}
      style={style}
    />
  );
}
