import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { lessonById, LESSONS } from '@/exercises/pulse-tapping/catalog';
import { Runner } from './-Runner';

export const Route = createFileRoute('/practice/pulse-tapping/lessons/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/practice/pulse-tapping" />,
  loader: ({ params }) => { const lesson = lessonById(params.lessonId); if (!lesson) throw notFound(); return lesson; },
});
function LessonPage() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={Runner}
    onBack={() => navigate({ to: '/practice/pulse-tapping' })}
    onOpenLesson={lessonId => navigate({ to: '/practice/pulse-tapping/lessons/$lessonId', params: { lessonId } })} />;
}
