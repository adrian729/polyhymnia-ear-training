import type { ReactNode } from 'react';
import { preloadArtwork } from '@ranx729/elder-scrolls';
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
import { MAIN_PAPER, SIDEBAR_PAPER, TABLE } from '@/lib/materials';
import { cn } from '@/lib/utils';

export type SheetSize = 'index' | 'exercise' | 'custom' | 'message' | 'sidebar';

// Two materials only: warm linen rag for every main sheet, ivory vellum for the contents sidebar.
const VARIANTS = {
  main: { paper: MAIN_PAPER, top: 'roll', bottom: 'paper' },
  aside: { paper: SIDEBAR_PAPER, top: 'roll', bottom: 'roll' },
} as const;

/** Decodes the main paper and the table, which every first screen shows, before React mounts. The
 *  HTML has already started their download (scripts/artwork-preload.ts). */
export function preloadSheetArtwork(): Promise<void> {
  return preloadArtwork({ papers: [VARIANTS.main.paper], surfaces: [TABLE] }).catch(() => {});
}

/** Decodes the sidebar paper, so entering a catalog shows the sidebar sheet in its first frame. */
export function preloadSidebarArtwork(): void {
  void preloadArtwork({ papers: [VARIANTS.aside.paper] }).catch(() => {});
}

export function Worktable({ children }: { children: ReactNode }) {
  return (
    <TableSurface surface={TABLE} className="worktable min-h-svh text-foreground">
      {children}
    </TableSurface>
  );
}

/** One elder-scrolls sheet. Pages use <Sheet> instead, so the layout can keep sheets mounted. */
export function PaperSheet({
  children,
  variant = 'main',
  size = 'index',
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: SheetSize;
}) {
  const { paper, top, bottom } = VARIANTS[variant];
  return (
    <Parchment
      paper={paper}
      top={top}
      bottom={bottom}
      maxWidth="fluid"
      shadow={false}
      className={cn('paper-sheet', `paper-sheet-${size}`)}
    >
      {children}
    </Parchment>
  );
}
