import type { ReactNode } from 'react';
import { RHYTHM_PASS_PERCENT, sessionAccuracy, type TimingSession, type AttemptReview } from '@/exercises/shared/rhythm/session';
import { cn } from '@/lib/utils';
import { TimingFeedback, TIMING_LEGEND } from './TimingFeedback';

export function TimingSummary({ session, graded, children, renderReview }: { session: TimingSession; graded: boolean; children: ReactNode; renderReview?: (review: AttemptReview) => ReactNode }) {
  const percent = sessionAccuracy(session);
  return <section className="flex w-full flex-col items-center gap-loose" aria-label="Exercise summary">
    <p className="text-lg">Score: <span className="font-semibold">{percent?.toFixed(1) ?? '—'}%</span>
      {graded && percent !== undefined && <span className={cn('ml-2 font-medium', percent >= RHYTHM_PASS_PERCENT ? 'text-success-strong' : 'text-destructive')}>
        {percent >= RHYTHM_PASS_PERCENT ? 'Passed' : 'Not passed'}
      </span>}
      <span className="ml-2 text-meta text-muted-foreground">{session.completed} attempts · average accuracy{graded && ` · ${RHYTHM_PASS_PERCENT}% to pass`}</span>
    </p>
    {children}
    {session.limit === 'endless' && <p className="text-meta text-muted-foreground">Average includes all attempts; the latest 50 are shown. Practice does not save a lesson pass.</p>}
    {session.reviews.length > 0 && <div className="flex w-full flex-col gap-3 text-left">
      <p className="text-meta text-muted-foreground">{TIMING_LEGEND}</p>
      {session.reviews.map((review, index) => <article key={review.id} aria-label={`Attempt ${session.completed - session.reviews.length + index + 1}`}
        className={cn('flex min-w-0 flex-col gap-3 rounded-lg border-2 p-4',
          review.accuracy >= RHYTHM_PASS_PERCENT ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10')}>
        <p className="text-meta font-medium text-muted-foreground">Attempt {session.completed - session.reviews.length + index + 1}{review.task && ` · ${review.task}`} · {review.bpm} BPM · {review.accuracy.toFixed(1)}% accuracy</p>
        <TimingFeedback result={review.result} showAccuracy={false} showLegend={false} />
        {renderReview?.(review)}
      </article>)}
    </div>}
  </section>;
}
