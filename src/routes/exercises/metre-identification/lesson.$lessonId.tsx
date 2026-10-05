import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { PracticeRunner } from '@/components/rhythm/PracticeRunner';
import { lessons } from '@/exercises/rhythm-practice/catalog';
const LESSONS = lessons('metre-identification');
export const Route = createFileRoute('/exercises/metre-identification/lesson/$lessonId')({
  loader: ({ params }) => { const lesson = LESSONS.find(l => l.id === params.lessonId); if (!lesson) throw notFound(); return lesson; },
  notFoundComponent: () => <LessonNotFound backTo="/exercises/metre-identification" />, component: Lesson,
});
function Lesson() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={PracticeRunner}
    onBack={() => navigate({ to: '/exercises/metre-identification' })}
    onOpenLesson={lessonId => navigate({ to: '/exercises/metre-identification/lesson/$lessonId', params: { lessonId } })} />;
}
