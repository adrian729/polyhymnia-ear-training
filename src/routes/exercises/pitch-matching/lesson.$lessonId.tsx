import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { LessonNotFound } from '@/components/lesson/WorkshopPage';
import { LessonRoutePage } from '@/components/lesson/LessonRoutePage';
import { PitchMatching } from '@/components/audio/PitchMatching';
import { lessonById, LESSONS } from '@/exercises/pitch-matching/catalog';

export const Route = createFileRoute('/exercises/pitch-matching/lesson/$lessonId')({
  component: LessonPage,
  notFoundComponent: () => <LessonNotFound backTo="/exercises/pitch-matching" />,
  loader: ({ params }) => { const lesson = lessonById(params.lessonId); if (!lesson) throw notFound(); return lesson; },
});
function LessonPage() {
  const navigate = useNavigate();
  return <LessonRoutePage lesson={Route.useLoaderData()} lessons={LESSONS} Runner={PitchMatching}
    onBack={() => void navigate({ to: '/exercises/pitch-matching' })}
    onOpenLesson={lessonId => void navigate({ to: '/exercises/pitch-matching/lesson/$lessonId', params: { lessonId } })} />;
}
