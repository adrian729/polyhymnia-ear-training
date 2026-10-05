import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/rhythm-reading/custom')({ validateSearch: SEARCH_PARSERS['rhythm-reading'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="rhythm-reading" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/rhythm-reading/custom', search, replace: true, resetScroll: false })} />;
}
