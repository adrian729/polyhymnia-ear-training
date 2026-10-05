// The SVGs are the source art (traced vectors, about 1.9 MB each). Pages get WebP sizes generated
// from them at build time; components pair each srcset with `sizes` matching how they draw it.
import logoSrc from '@/assets/logo/polyhymnia-logo.svg?h=56&format=webp';
import logoSrcSet from '@/assets/logo/polyhymnia-logo.svg?h=28;56;84&format=webp&as=srcset';
import framedLogoSrc from '@/assets/logo/polyhymnia-logo-framed.svg?w=384&format=webp';
import framedLogoSrcSet from '@/assets/logo/polyhymnia-logo-framed.svg?w=160;192;320;384;576&format=webp&as=srcset';

export const LOGO = { src: logoSrc, srcSet: logoSrcSet };
export const FRAMED_LOGO = { src: framedLogoSrc, srcSet: framedLogoSrcSet };
