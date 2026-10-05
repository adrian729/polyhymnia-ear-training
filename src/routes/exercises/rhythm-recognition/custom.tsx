import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/rhythm-recognition/custom')({ validateSearch: SEARCH_PARSERS['rhythm-recognition'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="rhythm-recognition" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/rhythm-recognition/custom', search, replace: true, resetScroll: false })} />;
}
