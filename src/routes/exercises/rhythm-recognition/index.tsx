import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/exercises/rhythm-recognition/')({ component: () => <PracticeWorkshop kind="rhythm-recognition" /> });
