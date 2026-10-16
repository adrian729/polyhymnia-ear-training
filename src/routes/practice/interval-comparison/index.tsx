import { createFileRoute, Link } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EXERCISE_TITLE,
  MODULES,
  OVERVIEW_HELP,
  lessonsForModule,
  getLessonResult,
  parseCustomSearch,
} from '@/exercises/interval-comparison';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';

export const Route = createFileRoute('/practice/interval-comparison/')({
  component: IntervalComparisonWorkshop,
});

function IntervalComparisonWorkshop() {
  return (
    <WorkshopPage
      title={EXERCISE_TITLE}
      blurb="Which interval is larger, or are they the same? No theory needed — the recommended first exercise."
      overview={OVERVIEW_HELP}
      modules={MODULES}
      lessonsForModule={lessonsForModule}
      getLessonResult={getLessonResult}
      headerAction={
        <Button asChild variant="outline" className="self-start">
          <Link to="/practice/interval-comparison/custom" search={parseCustomSearch({})}>
            <SlidersHorizontal />
            Set up custom exercise
          </Link>
        </Button>
      }
      renderLessonLink={(lessonId, className, children) => (
        <Link to="/practice/interval-comparison/lessons/$lessonId" params={{ lessonId }} className={className}>
          {children}
        </Link>
      )}
    />
  );
}
