import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { PaperSheet, type SheetSize } from '@/components/PaperSheet';
import { cn } from '@/lib/utils';

/*
 * Sheets persist across routes. The root layout owns the main sheet and, on catalog pages, the
 * contents sidebar sheet; pages describe theirs with <Sheet> instead of drawing paper. A navigation
 * then updates the existing sheets rather than mounting new ones, so the paper never blinks out and
 * elder-scrolls redraws only what changed. Catalog pages scroll their two sheets in separate panes;
 * every other page scrolls the document.
 */
interface Declaration {
  size: SheetSize;
  aside: boolean;
  label?: string;
}

interface SheetContextValue {
  declare: (declaration: Declaration) => void;
  settle: () => void;
  asideSlot: HTMLElement | null;
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

function Panes({ declaration, aside, children, ref }: { declaration: Declaration; aside: ReactNode; children: ReactNode; ref?: Ref<HTMLElement> }) {
  const workshop = declaration.aside;
  // The main pane keeps its position whether or not the sidebar renders, so its sheet stays mounted.
  return (
    <main ref={ref} className="sheet-layout" data-layout={workshop ? 'workshop' : 'page'}>
      {workshop && (
        <aside className="sheet-pane sheet-pane-aside" aria-label="Exercise contents" tabIndex={0} data-scroll-restoration-id="sheet-aside">
          <PaperSheet variant="aside" size="sidebar">{aside}</PaperSheet>
        </aside>
      )}
      <div
        className="sheet-pane sheet-pane-main"
        data-workshop-main={workshop ? '' : undefined}
        role={workshop ? 'region' : undefined}
        aria-label={workshop ? declaration.label : undefined}
        tabIndex={workshop ? 0 : undefined}
        data-scroll-restoration-id="sheet-main"
      >
        <PaperSheet size={declaration.size}>{children}</PaperSheet>
      </div>
    </main>
  );
}

const ASIDE_CONTENT_CLASS = 'sheet-aside-content flex flex-col gap-base py-base';

/*
 * A face loads the first time text needs it, so a page whose text needs a face not loaded yet would
 * paint in a fallback font and reflow when the face arrives. Laying the page out requests its faces
 * at once; while any is loading the sheets keep their paper and hide their text, which then appears
 * once, in its own fonts. CSS shows the text anyway after a cap (styles/surfaces.css).
 */
function holdTextForFonts(layout: HTMLElement): void {
  layout.getBoundingClientRect();
  if (document.fonts.status !== 'loading') return;
  layout.dataset.fontsPending = '';
  void document.fonts.ready.then(() => delete layout.dataset.fontsPending);
}

export function SheetLayout({ children }: { children: ReactNode }) {
  const [declaration, setDeclaration] = useState<Declaration>({ size: 'index', aside: false });
  const [asideSlot, setAsideSlot] = useState<HTMLElement | null>(null);
  const layout = useRef<HTMLElement>(null);
  const context = useMemo<SheetContextValue>(() => ({
    declare: next => setDeclaration(current =>
      current.size === next.size && current.aside === next.aside && current.label === next.label ? current : next),
    settle: () => { if (layout.current) holdTextForFonts(layout.current); },
    asideSlot,
  }), [asideSlot]);
  return (
    <SheetContext.Provider value={context}>
      <Panes ref={layout} declaration={declaration} aside={<div ref={setAsideSlot} className={ASIDE_CONTENT_CLASS} />}>{children}</Panes>
    </SheetContext.Provider>
  );
}

/**
 * A page's sheet: its size, its content (wrapped in `className`) and, on catalog pages, the contents
 * shown in the sidebar sheet. Inside the root layout it only describes the persistent sheets; on its
 * own (tests, the root error screen) it draws them itself.
 */
export function Sheet({
  size = 'index',
  className,
  aside,
  label,
  children,
}: {
  size?: SheetSize;
  className?: string;
  aside?: ReactNode;
  label?: string;
  children: ReactNode;
}) {
  const context = useContext(SheetContext);
  const hasAside = aside !== undefined;
  // Runs again once the sidebar slot exists and this page's sidebar contents are in it.
  useLayoutEffect(() => {
    context?.declare({ size, aside: hasAside, label });
    context?.settle();
  }, [context, size, hasAside, label]);
  const content = <div className={cn('paper-content', className)}>{children}</div>;
  if (!context) {
    return (
      <Panes declaration={{ size, aside: hasAside, label }} aside={<div className={ASIDE_CONTENT_CLASS}>{aside}</div>}>
        {content}
      </Panes>
    );
  }
  return (
    <>
      {content}
      {hasAside && context.asideSlot && createPortal(aside, context.asideSlot)}
    </>
  );
}
