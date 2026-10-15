// The SVGs are the source art. The acanthus logo combines the original vector portrait with an
// embedded, newly generated raster frame. Pages get WebP sizes generated at build time;
// components pair each srcset with `sizes` matching how they draw it. Lossless encoding preserves
// the vector silhouette and the painted frame's fine edges and colour.
import logoSrc from '@/assets/logo/polyhymnia-logo.svg?h=56&lossless&format=webp';
import logoSrcSet from '@/assets/logo/polyhymnia-logo.svg?h=28;56;84&lossless&format=webp&as=srcset';
import framedLogoSrc from '@/assets/logo/polyhymnia-logo-acanthus.svg?w=384&lossless&format=webp';
import framedLogoSrcSet from '@/assets/logo/polyhymnia-logo-acanthus.svg?w=160;192;320;384;576&lossless&format=webp&as=srcset';

export const LOGO = { src: logoSrc, srcSet: logoSrcSet };
export const FRAMED_LOGO = { src: framedLogoSrc, srcSet: framedLogoSrcSet };
