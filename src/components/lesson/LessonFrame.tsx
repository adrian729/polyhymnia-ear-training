import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/SheetLayout';
import { Ornament, OrnamentRule } from '@/components/Ornament';
import { cn } from '@/lib/utils';
import { ExerciseMasthead } from './ExerciseMasthead';

export function LessonFrame({ exerciseTitle, title, onBack, onFinish, progress, currentIndex, children }: {
  exerciseTitle: string;
  title: string;
  onBack: () => void;
  onFinish?: () => void;
  progress?: readonly ('upcoming' | 'right' | 'wrong')[];
  currentIndex?: number;
  children: ReactNode;
}) {
  return <Sheet size="exercise" className="flex flex-col gap-loose px-base py-loose">
    <nav aria-label="Breadcrumb"><ExerciseMasthead /></nav>
    <header className="flex flex-col gap-base">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-base">
        <Button variant="ghost" size="sm" onClick={onBack} className="rubricated font-specimen justify-self-start text-subhead">Back</Button>
        <div className="flex flex-col items-center gap-tight text-center">
          <p className="rubricated font-specimen text-meta text-rubric-strong">{exerciseTitle}</p>
          <h2 className="rubricated font-specimen text-subhead text-foreground">{title}</h2>
        </div>
        {onFinish ? <Button variant="ghost" size="sm" onClick={onFinish} className="rubricated font-specimen justify-self-end text-subhead">Finish</Button> : <div />}
      </div>
      <OrnamentRule name="cross-fleury" />
    </header>
    {progress && <div className="flex gap-[3px]" aria-hidden>
      {progress.map((segment, index) => <div key={index} className={cn('h-[3px] flex-1 transition-colors duration-fast',
        segment === 'upcoming' && 'bg-border', segment === 'right' && 'bg-success',
        segment === 'wrong' && 'bg-destructive', index === currentIndex && 'bg-rubric')} />)}
    </div>}
    {children}
  </Sheet>;
}

export function LessonActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-base">{children}</div>;
}

export function LessonActionButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={cn('rubricated font-specimen text-subhead', className)} {...props} />;
}

export function LessonSummaryFrame({ exerciseTitle, title, completed = true, children }: { exerciseTitle: string; title: string; completed?: boolean; children: ReactNode }) {
  return <Sheet size="exercise" className="flex flex-col items-center gap-loose px-base py-section text-center">
    <nav aria-label="Breadcrumb" className="self-start"><ExerciseMasthead /></nav>
    <div className="flex flex-col items-center gap-tight">
      <Ornament name="headpiece" className="h-16 w-52 text-primary-strong" />
      <p className="rubricated font-specimen text-meta text-rubric-strong">{exerciseTitle}</p>
      <h2 className="font-display text-2xl font-semibold">{title} — {completed ? 'done' : 'progress'}</h2>
    </div>
    {children}
  </Sheet>;
}
