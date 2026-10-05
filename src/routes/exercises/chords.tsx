import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';

export const Route = createFileRoute('/exercises/chords')({
  component: () => <ExerciseGroupPage groupId="chords" />,
});
