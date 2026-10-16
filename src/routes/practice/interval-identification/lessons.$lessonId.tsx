import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { lessonById, LESSONS } from '@/exercises/interval-identification';
import { Runner } from './-Runner';

export const Route = createFileRoute('/practice/interval-identification/lessons/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/practice/interval-identification" />,
  loader: ({ params }) => {
    const lesson = lessonById(params.lessonId);
    if (!lesson) throw notFound();
    return lesson;
  },
});

function LessonPage() {
  const navigate = useNavigate();
  return (
    <LessonRoutePage
      lesson={Route.useLoaderData()}
      lessons={LESSONS}
      Runner={Runner}
      onBack={() => navigate({ to: '/practice/interval-identification' })}
      onOpenLesson={(lessonId) =>
        navigate({ to: '/practice/interval-identification/lessons/$lessonId', params: { lessonId } })
      }
    />
  );
}
