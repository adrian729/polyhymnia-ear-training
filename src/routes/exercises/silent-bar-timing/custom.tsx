import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PracticeCustom } from '@/components/rhythm/PracticePages';
import { SEARCH_PARSERS } from '@/exercises/rhythm-practice/customSearch';
export const Route = createFileRoute('/exercises/silent-bar-timing/custom')({ validateSearch: SEARCH_PARSERS['silent-bar-timing'], component: Custom });
function Custom() {
  const navigate = useNavigate();
  return <PracticeCustom kind="silent-bar-timing" search={Route.useSearch()}
    navigate={search => void navigate({ to: '/exercises/silent-bar-timing/custom', search, replace: true, resetScroll: false })} />;
}
