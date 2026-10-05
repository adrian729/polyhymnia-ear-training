import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/rhythm-error-detection/custom')({ validateSearch: SEARCH_PARSERS['rhythm-error-detection'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="rhythm-error-detection" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/rhythm-error-detection/custom', search, replace: true, resetScroll: false })} />;
}
