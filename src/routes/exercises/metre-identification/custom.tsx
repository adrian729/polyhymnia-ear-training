import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/metre-identification/custom')({ validateSearch: SEARCH_PARSERS['metre-identification'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="metre-identification" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/metre-identification/custom', search, replace: true, resetScroll: false })} />;
}
