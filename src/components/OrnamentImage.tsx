import type { ImageAsset } from '@/lib/assets';
import { ResponsiveImage } from '@/components/ResponsiveImage';

/**
 * A full-colour ornament or illustration from a generated group. It renders through ResponsiveImage
 * with the generated srcset and intrinsic size, so the browser picks the density and it can be lazy
 * like any picture; `placement` decides eager/lazy exactly as elsewhere.
 */
export function OrnamentImage({ asset, sizes, placement, alt = '', className }: {
  asset: ImageAsset;
  /** The drawn width at each breakpoint, matching the classes that size the image. */
  sizes: string;
  placement: 'above-fold' | 'below-fold';
  alt?: string;
  className?: string;
}) {
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
