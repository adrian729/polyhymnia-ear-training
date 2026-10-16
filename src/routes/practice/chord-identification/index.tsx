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
} from '@/exercises/chord-identification';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';

export const Route = createFileRoute('/practice/chord-identification/')({
  component: ChordIdentificationWorkshop,
});

function ChordIdentificationWorkshop() {
  return (
    <WorkshopPage
      title={EXERCISE_TITLE}
      blurb="Hear one chord and name its quality."
      overview={OVERVIEW_HELP}
      modules={MODULES}
      lessonsForModule={lessonsForModule}
      getLessonResult={getLessonResult}
      headerAction={
        <Button asChild variant="outline" className="self-start">
          <Link to="/practice/chord-identification/custom" search={parseCustomSearch({})}>
            <SlidersHorizontal />
            Set up custom exercise
          </Link>
        </Button>
      }
      renderLessonLink={(lessonId, className, children) => (
        <Link to="/practice/chord-identification/lessons/$lessonId" params={{ lessonId }} className={className}>
          {children}
        </Link>
      )}
    />
  );
}
