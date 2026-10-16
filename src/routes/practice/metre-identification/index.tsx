import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/practice/metre-identification/')({ component: () => <PracticeWorkshop kind="metre-identification" /> });
