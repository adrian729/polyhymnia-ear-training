import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { PracticeRunner } from '@/components/rhythm/PracticeRunner';
import { lessons } from '@/exercises/rhythm-practice/catalog';
const LESSONS = lessons('metre-identification');
export const Route = createFileRoute('/practice/metre-identification/lessons/$lessonId')({
  loader: ({ params }) => { const lesson = LESSONS.find(l => l.id === params.lessonId); if (!lesson) throw notFound(); return lesson; },
  notFoundComponent: () => <LessonNotFound backTo="/practice/metre-identification" />, component: Lesson,
});
function Lesson() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={PracticeRunner}
    onBack={() => navigate({ to: '/practice/metre-identification' })}
    onOpenLesson={lessonId => navigate({ to: '/practice/metre-identification/lessons/$lessonId', params: { lessonId } })} />;
}
