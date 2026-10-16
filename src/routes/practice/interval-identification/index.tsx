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
} from '@/exercises/interval-identification';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';

export const Route = createFileRoute('/practice/interval-identification/')({
  component: IntervalIdentificationWorkshop,
});

function IntervalIdentificationWorkshop() {
  return (
    <WorkshopPage
      title={EXERCISE_TITLE}
      blurb="Hear one interval and name it."
      overview={OVERVIEW_HELP}
      modules={MODULES}
      lessonsForModule={lessonsForModule}
      getLessonResult={getLessonResult}
      headerAction={
        <Button asChild variant="outline" className="self-start">
          <Link to="/practice/interval-identification/custom" search={parseCustomSearch({})}>
            <SlidersHorizontal />
            Set up custom exercise
          </Link>
        </Button>
      }
      renderLessonLink={(lessonId, className, children) => (
        <Link to="/practice/interval-identification/lessons/$lessonId" params={{ lessonId }} className={className}>
          {children}
        </Link>
      )}
    />
  );
}
