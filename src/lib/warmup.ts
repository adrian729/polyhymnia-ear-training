import { afterFirstScreen } from '@/lib/first-paint';

/**
 * Warms the copy a screen would pick for an image, once the first screen is up and the browser is
 * idle. The browser chooses the density from the same `srcSet`/`sizes` the element uses, so no
 * oversized copy is fetched and a below-the-fold image is often cached before the reader reaches it.
 * It never competes with the first screen and is best-effort: a failure is ignored.
 */
export function warmImage(src: string, srcSet: string, sizes: string): void {
  afterFirstScreen(() => {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.sizes = sizes;
    image.srcset = srcSet;
    image.src = src;
  });
}
