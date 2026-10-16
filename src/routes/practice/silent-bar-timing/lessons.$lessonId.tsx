import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { PracticeRunner } from '@/components/rhythm/PracticeRunner';
import { lessons } from '@/exercises/rhythm-practice/catalog';
const LESSONS = lessons('silent-bar-timing');
export const Route = createFileRoute('/practice/silent-bar-timing/lessons/$lessonId')({
  loader: ({ params }) => { const lesson = LESSONS.find(l => l.id === params.lessonId); if (!lesson) throw notFound(); return lesson; },
  notFoundComponent: () => <LessonNotFound backTo="/practice/silent-bar-timing" />, component: Lesson,
});
function Lesson() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={PracticeRunner}
    onBack={() => navigate({ to: '/practice/silent-bar-timing' })}
    onOpenLesson={lessonId => navigate({ to: '/practice/silent-bar-timing/lessons/$lessonId', params: { lessonId } })} />;
}
