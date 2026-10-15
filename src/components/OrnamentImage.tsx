import { useEffect } from 'react';
import type { ImageAsset } from '@/lib/assets';
import { warmImage } from '@/lib/warmup';
import { ResponsiveImage } from '@/components/ResponsiveImage';

/**
 * A full-colour ornament or illustration from a generated group. It renders through ResponsiveImage
 * with the generated srcset and intrinsic size, so the browser picks the density and it can be lazy
 * like any picture; `placement` decides eager/lazy exactly as elsewhere. `warm` fetches a below-the-fold
 * copy once the page is shown (warmImage), so a reader who scrolls finds it already cached.
 */
export function OrnamentImage({ asset, sizes, placement, warm = false, alt = '', className }: {
  asset: ImageAsset;
  /** The drawn width at each breakpoint, matching the classes that size the image. */
  sizes: string;
  placement: 'above-fold' | 'below-fold';
  warm?: boolean;
  alt?: string;
  className?: string;
}) {
  useEffect(() => {
    if (warm) warmImage(asset.src, asset.srcSet, sizes);
  }, [warm, asset, sizes]);
  return <ResponsiveImage
    src={asset.src}
    srcSet={asset.srcSet}
    sizes={sizes}
    width={asset.width}
    height={asset.height}
    alt={alt}
    placement={placement}
    className={className}
  />;
}
