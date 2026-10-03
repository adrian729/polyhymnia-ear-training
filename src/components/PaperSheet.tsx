import type { ReactNode } from 'react';
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
import type { PaperId } from '@ranx729/elder-scrolls';
import { cn } from '@/lib/utils';

type LightPaper = Extract<PaperId, 'ivory' | 'original' | 'sage' | 'rag'>;

export function Worktable({ children }: { children: ReactNode }) {
  return (
    <TableSurface surface="walnut" className="worktable min-h-svh text-foreground">
      {children}
    </TableSurface>
  );
}

export function PaperSheet({
  children,
  paper = 'ivory',
  size = 'index',
  className,
}: {
  children: ReactNode;
  paper?: LightPaper;
  size?: 'index' | 'exercise' | 'custom' | 'message' | 'sidebar';
  className?: string;
}) {
  return (
    <Parchment
      paper={paper}
      top={size === 'sidebar' ? 'paper' : 'roll'}
      bottom="paper"
      maxWidth="fluid"
      shadow={false}
      className={cn('paper-sheet', `paper-sheet-${size}`)}
    >
      <div className={cn('paper-content', className)}>{children}</div>
    </Parchment>
  );
}
