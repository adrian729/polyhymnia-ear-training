import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/practice/rhythm-reading/')({ component: () => <PracticeWorkshop kind="rhythm-reading" /> });
