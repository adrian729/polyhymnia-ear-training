import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/exercises/rhythm-error-detection/')({ component: () => <PracticeWorkshop kind="rhythm-error-detection" /> });
