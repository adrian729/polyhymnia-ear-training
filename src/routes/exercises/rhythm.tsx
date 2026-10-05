import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';

export const Route = createFileRoute('/exercises/rhythm')({
  component: () => <ExerciseGroupPage groupId="rhythm" />,
});
