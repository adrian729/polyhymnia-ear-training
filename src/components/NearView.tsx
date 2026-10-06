import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders `children` once they come within 300 px of the viewport, and keeps them; until then
 * `placeholder`. Work below the fold (a score, its layout and code) waits until it is about to show.
 */
export function NearView({ children, placeholder, className }: { children: ReactNode; placeholder?: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  if (near) return <>{children}</>;
  return (
    <div ref={ref} className={className}>
      {placeholder}
    </div>
  );
}
