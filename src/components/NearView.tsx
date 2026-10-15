import { useEffect, useRef, useState, type ReactNode } from 'react';
import { prepareNearContent } from '@/lib/first-paint';

/**
 * Renders `children` once they come within 300 px of the viewport, and keeps them; until then
 * `placeholder`. Work below the fold (a score, its layout and code) waits until it is about to show.
 *
 * With `prepare`, they show without a wait instead: once the first screen is shown and the browser is
 * idle, `prepare` fetches what they need (their code, fonts), ahead of speculative prefetches
 * (`prepareNearContent`), and from then on they render two viewports ahead of the reader, room for
 * even a fast flick. Only downloads happen early, and only after the first screen; layout and
 * rendering wait until the reader is within those two viewports.
 */
export function NearView({ children, placeholder, className, prepare }: {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  prepare?: () => Promise<unknown>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [prepared, setPrepared] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      // The wider margin only once prepared: at first it would take in content just below the fold of
      // a tall screen and render it alongside the first screen. Two viewports, not one: the home score
      // sits just past a single viewport below the fold, and with a one-viewport margin it never
      // rendered until the reader scrolled to it, though its code and font were already cached.
      { rootMargin: prepared ? '200% 0px' : '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, prepared]);

  useEffect(() => {
    if (!prepare) return;
    let live = true;
    // A failed fetch leaves the children to load themselves once the reader comes near.
    prepareNearContent(prepare).then(() => { if (live) setPrepared(true); }, () => {});
    return () => { live = false; };
  }, [prepare]);

  if (near) return <>{children}</>;
  return (
    <div ref={ref} className={className}>
      {placeholder}
    </div>
  );
}
