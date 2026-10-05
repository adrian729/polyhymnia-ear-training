import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/exercises/rhythm-reading/')({ component: () => <PracticeWorkshop kind="rhythm-reading" /> });
