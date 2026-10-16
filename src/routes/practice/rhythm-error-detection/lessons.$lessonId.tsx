import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { PracticeRunner } from '@/components/rhythm/PracticeRunner';
import { lessons } from '@/exercises/rhythm-practice/catalog';
const LESSONS = lessons('rhythm-error-detection');
export const Route = createFileRoute('/practice/rhythm-error-detection/lessons/$lessonId')({
  loader: ({ params }) => { const lesson = LESSONS.find(l => l.id === params.lessonId); if (!lesson) throw notFound(); return lesson; },
  notFoundComponent: () => <LessonNotFound backTo="/practice/rhythm-error-detection" />, component: Lesson,
});
function Lesson() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={PracticeRunner}
    onBack={() => navigate({ to: '/practice/rhythm-error-detection' })}
    onOpenLesson={lessonId => navigate({ to: '/practice/rhythm-error-detection/lessons/$lessonId', params: { lessonId } })} />;
}
