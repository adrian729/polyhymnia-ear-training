import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/rhythm-tap-back/custom')({ validateSearch: SEARCH_PARSERS['rhythm-tap-back'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="rhythm-tap-back" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/rhythm-tap-back/custom', search, replace: true, resetScroll: false })} />;
}
