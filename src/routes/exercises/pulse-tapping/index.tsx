import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';
import { TimingSetup } from '@/components/rhythm/TimingSetup';
import { EXERCISE_TITLE, MODULES, OVERVIEW_HELP, lessonById, lessonsForModule } from '@/exercises/pulse-tapping/catalog';
import { parseCustomSearch } from '@/exercises/pulse-tapping/customSearch';
import { getTimingLessonResult, policyKey, readTimingPreferences, saveTimingPreferences } from '@/exercises/shared/rhythm/store';

export const Route = createFileRoute('/exercises/pulse-tapping/')({ component: Workshop });
function Workshop() {
  const [preferences, setPreferences] = useState(readTimingPreferences);
  return <WorkshopPage title={EXERCISE_TITLE} blurb="Feel a steady pulse, from guided beats to compound grouping, skipped beats and displaced clicks."
    overview={OVERVIEW_HELP} modules={MODULES} lessonsForModule={lessonsForModule} soundControls={null}
    getLessonResult={id => getTimingLessonResult(policyKey(id, lessonById(id)!.options, preferences))}
    headerAction={<div className="flex flex-col gap-base">
      <TimingSetup value={preferences} onChange={next => { saveTimingPreferences(next); setPreferences(next); }} />
      <Button asChild variant="outline" className="self-start"><Link to="/exercises/pulse-tapping/custom" search={parseCustomSearch({})}>Set up custom exercise</Link></Button>
    </div>}
    renderLessonLink={(lessonId, className, children) => <Link to="/exercises/pulse-tapping/lesson/$lessonId" params={{ lessonId }} className={className}>{children}</Link>} />;
}
