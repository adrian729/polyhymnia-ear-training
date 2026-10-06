import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ChevronsUp } from 'lucide-react';
import { PaperSheet } from '@/components/PaperSheet';

/*
 * The contents sidebar on screens where it stacks above the main sheet (narrower than 64rem): a
 * rolled-up scroll, only its two rolls, that unrolls over the whole screen when tapped and rolls up
 * again from its collapse button, Escape, or any link in it. Open, the whole scroll moves when the
 * reader scrolls, like the main sheet. Wider screens keep the plain sidebar: none of this applies.
 */
const STACKED = '(width < 64rem)';

type Phase = 'closed' | 'opening' | 'open' | 'closing';

function subscribeStacked(changed: () => void) {
  const query = matchMedia(STACKED);
  query.addEventListener('change', changed);
  return () => query.removeEventListener('change', changed);
}

// Whether the sidebar stacks above the main sheet, so it rolls up.
function useStackedSidebar(): boolean {
  return useSyncExternalStore(subscribeStacked, () => matchMedia(STACKED).matches, () => false);
}

// The theme's slow transition, in milliseconds whether CSS spells it in s or ms.
function motion(): { duration: number; easing: string } {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { duration: 0, easing: 'linear' };
  const style = getComputedStyle(document.documentElement);
  const time = style.getPropertyValue('--transition-duration-slow').trim();
  const duration = parseFloat(time) * (/[^m]s$/.test(time) ? 1000 : 1);
  return {
    duration: Number.isFinite(duration) && duration > 0 ? duration : 320,
    easing: style.getPropertyValue('--ease-out-quart').trim() || 'ease-out',
  };
}

// The fold's length (styles/surfaces.css): negative while it pulls the two rolls together. It lives
// on the layout, the pane's parent, so the main pane beside the scroll moves with it.
function foldLength(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).getPropertyValue('--contents-fold'));
}

/**
 * The sidebar pane. `onOpenChange` reports whether the scroll covers the screen, so the layout can
 * make the page behind it inert; `page` changes with every page, which rolls the scroll up.
 */
export function ContentsScroll({ children, page, onOpenChange }: {
  children: ReactNode;
  page: unknown;
  onOpenChange: (open: boolean) => void;
}) {
  const stacked = useStackedSidebar();
  const [phase, setPhase] = useState<Phase>('closed');
  const pane = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const fold = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const collapse = useRef<HTMLButtonElement>(null);
  const closingFrom = useRef(0);
  const refocus = useRef(false);
  const id = useId();
  const rolled = stacked && phase === 'closed';

  const open = useCallback(() => {
    if (stacked && phase === 'closed') setPhase('opening');
  }, [stacked, phase]);

  const close = useCallback(() => {
    if (phase !== 'open' && phase !== 'opening') return;
    if (!pane.current || !frame.current || !fold.current) return;
    refocus.current = pane.current.contains(document.activeElement);
    // Measured before the phase changes: the closing state's CSS rolls the fold back up.
    closingFrom.current = phase === 'open' ? fold.current.getBoundingClientRect().height : foldLength(frame.current);
    setPhase('closing');
  }, [phase]);

  // The contents arrive through a portal, so their clicks never bubble through this component's
  // React tree: listen on the frame itself. Any link rolls the scroll up; so does Escape, wherever
  // focus is, since the scroll covers everything else.
  useEffect(() => {
    const element = frame.current;
    if (!element || phase === 'closed') return;
    const clicked = (event: MouseEvent) => { if ((event.target as Element).closest('a')) close(); };
    const pressed = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
    element.addEventListener('click', clicked);
    document.addEventListener('keydown', pressed);
    return () => { element.removeEventListener('click', clicked); document.removeEventListener('keydown', pressed); };
  }, [phase, close]);

  // Unroll: the rolls part and the fold grows to its contents, at least filling the screen.
  useLayoutEffect(() => {
    const layout = pane.current?.parentElement;
    if (phase !== 'opening' || !layout || !frame.current || !fold.current) return;
    const style = getComputedStyle(frame.current);
    const available = frame.current.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const sheet = fold.current.closest<HTMLElement>('.es-parchment')!;
    const rolled = foldLength(layout);
    // The sheet's height is its caps' plus the fold's length, negative as it is now.
    const fill = available - (sheet.getBoundingClientRect().height - rolled);
    const contents = (fold.current.firstElementChild as HTMLElement).offsetHeight;
    frame.current.style.setProperty('--contents-fill', `${fill}px`);
    // Held at its end until the open state takes over, so no frame falls back to the rolled scroll.
    const animation = layout.animate([{ '--contents-fold': `${rolled}px` }, { '--contents-fold': `${Math.max(contents, fill)}px` }], { ...motion(), fill: 'forwards' });
    animation.onfinish = () => setPhase(current => (current === 'opening' ? 'open' : current));
    return () => animation.cancel();
  }, [phase]);

  // Roll up: the fold shrinks until the rolls touch, then the scroll returns to its place in the page.
  useLayoutEffect(() => {
    const layout = pane.current?.parentElement;
    if (phase !== 'closing' || !layout) return;
    const animation = layout.animate([{ '--contents-fold': `${closingFrom.current}px` }, { '--contents-fold': `${foldLength(layout)}px` }], { ...motion(), fill: 'forwards' });
    animation.onfinish = () => setPhase(current => (current === 'closing' ? 'closed' : current));
    return () => animation.cancel();
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== 'closed') return;
    frame.current?.style.removeProperty('--contents-fill');
    frame.current?.scrollTo({ top: 0 });
  }, [phase]);

  useEffect(() => {
    onOpenChange(stacked && phase !== 'closed');
  }, [stacked, phase, onOpenChange]);
  // Leaving catalog pages mid-scroll uncovers the page too.
  useEffect(() => () => onOpenChange(false), [onOpenChange]);

  // Focus follows the scroll: into it when it opens, back to the rolled scroll when it closes.
  useEffect(() => {
    if (phase === 'open') collapse.current?.focus({ preventScroll: true });
    if (phase === 'closed' && refocus.current) {
      refocus.current = false;
      toggle.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  // A new page, or a wide screen where the sidebar no longer stacks, rolls the scroll up at once.
  useEffect(() => setPhase('closed'), [page, stacked]);

  return (
    <aside ref={pane} className="sheet-pane sheet-pane-aside" aria-label="Exercise contents" tabIndex={rolled ? -1 : 0}
      data-scroll-restoration-id="sheet-aside" data-contents={stacked ? phase : undefined}>
      <div ref={frame} id={id} className="sheet-aside-frame">
        {stacked && (
          <button ref={toggle} type="button" className="sheet-aside-open" aria-expanded={phase !== 'closed'} aria-controls={id}
            aria-label="Open exercise contents" tabIndex={rolled ? 0 : -1} onClick={open} />
        )}
        <PaperSheet variant="aside" size="sidebar">
          <div ref={fold} className="sheet-aside-fold" inert={rolled}>
            {/* One block, so the collapse button rolls up with the paper. */}
            <div className="sheet-aside-unrolled">
              {stacked && (
                <button ref={collapse} type="button" className="sheet-aside-close" aria-label="Roll up exercise contents" onClick={close}>
                  <ChevronsUp aria-hidden className="size-5" />
                </button>
              )}
              {children}
            </div>
          </div>
        </PaperSheet>
      </div>
    </aside>
  );
}
