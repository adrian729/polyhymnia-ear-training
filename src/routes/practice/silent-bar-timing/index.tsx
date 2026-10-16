import { createFileRoute } from '@tanstack/react-router';
import { PracticeWorkshop } from '@/components/rhythm/PracticePages';
export const Route = createFileRoute('/practice/silent-bar-timing/')({ component: () => <PracticeWorkshop kind="silent-bar-timing" /> });
