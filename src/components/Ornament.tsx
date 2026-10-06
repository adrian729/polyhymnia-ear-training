import { useLayoutEffect, useRef, type ReactNode } from 'react';
// Each ornament is generated at build time as a ladder of heights (32, 64, 128 and 256 px, plus
// the source), and an Ornament draws the smallest one that covers its drawn size on this screen.
// Sizes follow the layout, so a new placement needs no size bookkeeping.
import fleurDeLis from '@/assets/ornaments/vectorian-006.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import barSprig from '@/assets/ornaments/vectorian-010.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import flourishEnd from '@/assets/ornaments/vectorian-011.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import flourishStart from '@/assets/ornaments/vectorian-014.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import barCap from '@/assets/ornaments/vectorian-019.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import gothicLeaf from '@/assets/ornaments/vectorian-020.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import crossFleury from '@/assets/ornaments/vectorian-022.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import headpiece from '@/assets/ornaments/vectorian-058.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerTl from '@/assets/ornaments/vectorian-063-tl.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerTr from '@/assets/ornaments/vectorian-063-tr.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerBl from '@/assets/ornaments/vectorian-063-bl.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import leafCornerBr from '@/assets/ornaments/vectorian-063-br.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import tailpiece from '@/assets/ornaments/vectorian-066.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import runningVine from '@/assets/ornaments/vectorian-070.webp?h=32;64;128;256;4096&format=webp&as=metadata:src;width;height';
import { cn } from '@/lib/utils';

type Ladder = readonly { src: string; width: number; height: number }[];

const ladder = (images: Ladder | Ladder[number]): Ladder => [...(Array.isArray(images) ? images : [images])].sort((a, b) => a.height - b.height);

const ORNAMENTS = {
  'fleur-de-lis': ladder(fleurDeLis),
  'gothic-leaf': ladder(gothicLeaf),
  'cross-fleury': ladder(crossFleury),
  'flourish-start': ladder(flourishStart),
  'flourish-end': ladder(flourishEnd),
  'running-vine': ladder(runningVine),
  'bar-cap': ladder(barCap),
  'bar-sprig': ladder(barSprig),
  'leaf-tl': ladder(leafCornerTl),
  'leaf-tr': ladder(leafCornerTr),
  'leaf-bl': ladder(leafCornerBl),
  'leaf-br': ladder(leafCornerBr),
  headpiece: ladder(headpiece),
  tailpiece: ladder(tailpiece),
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

export function Ornament({ name, className }: { name: OrnamentName; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = ref.current!;
    const images = ORNAMENTS[name];
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
  }, [name]);
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

export function OrnamentRule({ name, className }: { name: OrnamentName; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-base text-primary-strong', className)}>
      <span className="h-px flex-1 bg-current opacity-80" />
      <Ornament name={name} className="size-7" />
      <span className="h-px flex-1 bg-current opacity-80" />
    </div>
  );
}

export function FlourishRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex h-6 items-center text-primary-strong', className)}>
      <Ornament name="flourish-start" className="h-full w-11" />
      <span className="h-px flex-1 bg-current" />
      <Ornament name="flourish-end" className="h-full w-11" />
    </div>
  );
}

export function BarBorder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bar-frame', className)}>
      <span aria-hidden="true" className="bar" />
      <Ornament name="bar-cap" className="bar-cap bar-cap-top" />
      <Ornament name="bar-sprig" className="bar-sprig" />
      <Ornament name="bar-cap" className="bar-cap bar-cap-bottom" />
      <div className="bar-text">{children}</div>
    </div>
  );
}
