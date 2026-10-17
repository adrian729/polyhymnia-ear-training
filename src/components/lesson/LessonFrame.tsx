import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/SheetLayout';
import { OrnamentImage } from '@/components/OrnamentImage';
import { imageAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import decorations from '@/generated/assets/decorations';
import { ExerciseMasthead } from './ExerciseMasthead';

const FLOURISH = imageAsset(decorations, 'acanthus-horizontal-flourish');
const HEADPIECE = imageAsset(decorations, 'acanthus-headpiece');

export function LessonFrame({ exerciseTitle, title, onBack, onFinish, progress, currentIndex, children }: {
  exerciseTitle: string;
  title: string;
  onBack: () => void;
  onFinish?: () => void;
  progress?: readonly ('upcoming' | 'right' | 'wrong')[];
  currentIndex?: number;
  children: ReactNode;
}) {
  const completed = progress?.filter(segment => segment !== 'upcoming').length ?? 0;
  return <Sheet size="exercise" className="flex flex-col gap-base py-base sm:gap-loose">
    <nav aria-label="Breadcrumb"><ExerciseMasthead /></nav>
    <header className="flex flex-col gap-base">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-tight sm:grid-cols-[1fr_auto_1fr] sm:gap-base">
        <Button variant="ghost" size="sm" onClick={onBack} className="rubricated font-specimen min-h-11 justify-self-start text-subhead">Back</Button>
        <div className="flex flex-col items-center gap-tight text-center">
          <p className="rubricated font-specimen text-meta text-rubric-strong">{exerciseTitle}</p>
          <h1 className="rubricated font-specimen text-subhead text-foreground">{title}</h1>
        </div>
        {onFinish ? <Button variant="ghost" size="sm" onClick={onFinish} className="rubricated font-specimen min-h-11 justify-self-end text-subhead">Finish</Button> : <div />}
      </div>
      {/* Lighter than the page dividers, so it never competes with the question. */}
      <OrnamentImage asset={FLOURISH} sizes="(min-width: 40rem) 10rem, 8rem" placement="above-fold" className="mx-auto h-auto w-32 sm:w-40" />
    </header>
    {progress && progress.length > 0 && <div className="flex gap-[3px]" role="progressbar" aria-label="Lesson progress"
      aria-valuemin={0} aria-valuemax={progress.length} aria-valuenow={completed}
      aria-valuetext={`${completed} of ${progress.length} completed`}>
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
  return <Button className={cn('rubricated font-specimen min-h-11 px-base text-subhead', className)} {...props} />;
}

export function LessonSummaryFrame({ exerciseTitle, title, completed = true, children }: { exerciseTitle: string; title: string; completed?: boolean; children: ReactNode }) {
  return <Sheet size="exercise" className="flex flex-col items-center gap-loose px-base py-section text-center">
    <nav aria-label="Breadcrumb" className="self-start"><ExerciseMasthead /></nav>
    <div className="flex flex-col items-center gap-tight">
      <OrnamentImage asset={HEADPIECE} sizes="13rem" placement="above-fold" className="h-auto w-52" />
      <p className="rubricated font-specimen text-meta text-rubric-strong">{exerciseTitle}</p>
      <h1 className="font-display text-2xl font-semibold">{title} — {completed ? 'done' : 'progress'}</h1>
    </div>
    {children}
  </Sheet>;
}
