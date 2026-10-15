import { afterNearContent } from '@/lib/first-paint';

const warmed = new Set<string>();

/**
 * Warms the copy a screen would pick for an image, once the first screen is up, the content just
 * below it is prepared and the browser is idle. The browser chooses the density from the same
 * `srcSet`/`sizes` the element uses, so no oversized copy is fetched and a below-the-fold image is
 * often cached before the reader reaches it. Best-effort: a failure is ignored.
 *
 * Call it from the page that shows the image (OrnamentImage's `warm`), never at a route module's
 * top level: that code ships in the entry chunk and would warm the image on every page.
 */
export function warmImage(src: string, srcSet: string, sizes: string): void {
  if (warmed.has(srcSet)) return;
  warmed.add(srcSet);
  afterNearContent(() => {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.sizes = sizes;
    image.srcset = srcSet;
    image.src = src;
  });
}
