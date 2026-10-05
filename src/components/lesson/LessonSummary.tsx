import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { passedLesson, scoreOf, type AnsweredQuestion, type LessonFlowState } from '@/exercises/shared';
import { LazyReveal } from './LazyReveal';
import { LessonSummaryFrame } from './LessonFrame';

export interface LessonSummaryProps<Q, A> {
  exerciseTitle: string;
  title: string;
  flow: LessonFlowState<Q, A>;
  onBack: () => void;
  onRetake: () => void;
  onNextLesson?: () => void;
  onReplayQuestion: (question: Q) => void;
  renderReveal: (question: Q) => ReactNode;
  revealPlaceholder: ReactNode;
  summaryNote?: (item: AnsweredQuestion<Q, A>) => string;
}

export function LessonSummary<Q, A>({
  exerciseTitle,
  title,
  flow,
  onBack,
  onRetake,
  onNextLesson,
  onReplayQuestion,
  renderReveal,
  revealPlaceholder,
  summaryNote,
}: LessonSummaryProps<Q, A>) {
  const percent = Math.round(scoreOf(flow.answered) * 100);
  const passed = passedLesson(flow);
  return (
    <LessonSummaryFrame exerciseTitle={exerciseTitle} title={title}>
      <p className="text-lg">
        Score: <span className="font-semibold">{percent}%</span>
        {flow.graded && (
          <span className={cn('ml-2 font-medium', passed ? 'text-success-strong' : 'text-destructive')}>
            {passed ? 'Passed' : 'Not passed'}
          </span>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back to lessons
        </Button>
        <Button variant={passed ? 'secondary' : 'default'} onClick={onRetake}>
          Retake
        </Button>
        {onNextLesson && (
          <Button variant={passed ? 'default' : 'outline'} onClick={onNextLesson}>
            Next lesson
          </Button>
        )}
      </div>
      <div className="flex w-full flex-col gap-3 text-left">
        {flow.answered.map((a, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col gap-3 rounded-lg border-2 p-4',
              a.correct ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10',
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-meta font-medium text-muted-foreground">
                Question {i + 1} · {a.correct ? 'Correct' : `Wrong${summaryNote ? summaryNote(a) : ''}`}
              </span>
              <Button size="sm" variant="outline" onClick={() => onReplayQuestion(a.question)}>
                Replay
              </Button>
            </div>
            <LazyReveal question={a.question} renderReveal={renderReveal} placeholder={revealPlaceholder} />
          </div>
        ))}
      </div>
    </LessonSummaryFrame>
  );
}
