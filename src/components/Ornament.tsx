import { useLayoutEffect, useRef } from 'react';
// Each ornament is generated at build time as a ladder of heights (32, 64, 128 and 256 px, plus
// the source), and an Ornament draws the smallest one that covers its drawn size on this screen.
// Sizes follow the layout, so a new placement needs no size bookkeeping. Generated masks
// (scripts/ornament-selection.json, role `mask`) draw the same way: <Ornament asset={maskAsset(...)} />.
import leafCornerTl from '@/assets/ornaments/vectorian-063-tl.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerTr from '@/assets/ornaments/vectorian-063-tr.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerBl from '@/assets/ornaments/vectorian-063-bl.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerBr from '@/assets/ornaments/vectorian-063-br.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import type { MaskAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';

type Ladder = readonly { src: string; width: number; height: number }[];

const ladder = (images: Ladder | Ladder[number]): Ladder => [...(Array.isArray(images) ? images : [images])].sort((a, b) => a.height - b.height);

const ORNAMENTS = {
  'leaf-tl': ladder(leafCornerTl),
  'leaf-tr': ladder(leafCornerTr),
  'leaf-bl': ladder(leafCornerBl),
  'leaf-br': ladder(leafCornerBr),
} as const;

export type OrnamentName = keyof typeof ORNAMENTS;

const ladders = new WeakMap<Element, Ladder>();
const drawn = new WeakMap<Element, number>();
let observer: ResizeObserver | undefined;

function setMask(element: HTMLElement, src: string) {
  const mask = `url("${src}")`;
  element.style.maskImage = mask;
  element.style.setProperty('-webkit-mask-image', mask);
}

// Masks change no geometry, so observing and choosing here never feeds back into layout. Sizes
// only grow: a shrinking ornament keeps the file it already has.
function fit(entries: ResizeObserverEntry[]) {
  for (const { target, contentRect: box } of entries) {
    const images = ladders.get(target);
    if (!images || !box.width || !box.height) continue;
    const largest = images[images.length - 1]!;
    const size = getComputedStyle(target).maskSize;
    const height = size.startsWith('auto 100%') ? box.height
      : size.startsWith('100% auto') ? box.width * largest.height / largest.width
        : Math.min(box.height, box.width * largest.height / largest.width);
    const covering = images.findIndex(image => image.height >= height * devicePixelRatio);
    const pick = Math.max(drawn.get(target) ?? 0, covering < 0 ? images.length - 1 : covering);
    if (drawn.get(target) === pick) continue;
    drawn.set(target, pick);
    setMask(target as HTMLElement, images[pick]!.src);
  }
}

export function Ornament({ className, ...art }: ({ name: OrnamentName; asset?: never } | { asset: MaskAsset; name?: never }) & { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const images = art.asset ? art.asset.ladder : ORNAMENTS[art.name];
  useLayoutEffect(() => {
    const element = ref.current!;
    if (typeof ResizeObserver === 'undefined') {
      setMask(element, images[images.length - 1]!.src);
      return;
    }
    ladders.set(element, images);
    observer ??= new ResizeObserver(fit);
    observer.observe(element);
    return () => {
      observer!.unobserve(element);
      ladders.delete(element);
      drawn.delete(element);
    };
  }, [images]);
  return <span ref={ref} aria-hidden="true" className={cn('ornament', className)} />;
}

/** The leaf corners of an answer tile; the tile takes the `ornament-corners` utility. */
export function OrnamentCorners() {
  return (
    <>
      <Ornament name="leaf-tl" className="ornament-corner ornament-corner-tl" />
      <Ornament name="leaf-tr" className="ornament-corner ornament-corner-tr" />
      <Ornament name="leaf-bl" className="ornament-corner ornament-corner-bl" />
      <Ornament name="leaf-br" className="ornament-corner ornament-corner-br" />
    </>
  );
}
