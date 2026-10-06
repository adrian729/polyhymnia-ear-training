// The SVGs are the source art (traced vectors, about 1.9 MB each). Pages get WebP sizes generated
// from them at build time; components pair each srcset with `sizes` matching how they draw it.
// Lossless: flat colour and hard edges are where lossy WebP shows artifacts, and here it saves
// only a few KB.
import logoSrc from '@/assets/logo/polyhymnia-logo.svg?h=56&lossless&format=webp';
import logoSrcSet from '@/assets/logo/polyhymnia-logo.svg?h=28;56;84&lossless&format=webp&as=srcset';
import framedLogoSrc from '@/assets/logo/polyhymnia-logo-framed.svg?w=384&lossless&format=webp';
import framedLogoSrcSet from '@/assets/logo/polyhymnia-logo-framed.svg?w=160;192;320;384;576&lossless&format=webp&as=srcset';

export const LOGO = { src: logoSrc, srcSet: logoSrcSet };
export const FRAMED_LOGO = { src: framedLogoSrc, srcSet: framedLogoSrcSet };
