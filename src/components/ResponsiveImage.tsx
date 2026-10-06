import type { ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding' | 'fetchPriority'> & {
  /** Build-time generated sources: a vite-imagetools `as=srcset` import and one of its sizes. */
  src: string;
  srcSet: string;
  /** The drawn width, matching the classes that size the image. */
  sizes: string;
  /** Intrinsic size of the source art, so the layout reserves the right box before loading. */
  width: number;
  height: number;
  alt: string;
  /** Visible on load: fetched at once. Below the fold: lazy, low priority. */
  placement: 'above-fold' | 'below-fold';
};

/** The app's only <img>. Every image declares its sizes and placement, so none ships oversized or eager by accident. */
export function ResponsiveImage({ placement, ...props }: Props) {
  const below = placement === 'below-fold';
  return <img {...props} loading={below ? 'lazy' : 'eager'} decoding="async" fetchPriority={below ? 'low' : 'auto'} />;
}
