import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/exercises/rhythm-tap-back/')({ component: () => <PracticeWorkshop kind="rhythm-tap-back" /> });
