import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MicOff, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';
import { useExerciseMicrophone } from '@/components/audio/MicrophoneProvider';
import { cn } from '@/lib/utils';
import { PitchSetup } from '@/components/audio/PitchSetup';
import { readPitchSettings, savePitchSettings } from '@/exercises/pitch-matching/settings';
import { EXERCISE_TITLE, MODULES, OVERVIEW_HELP, lessonsForModule, getLessonResult } from '@/exercises/pitch-matching/catalog';

export const Route = createFileRoute('/exercises/pitch-matching/')({ component: PitchWorkshop });

function PitchWorkshop() {
  const microphone = useExerciseMicrophone();
  const [settings, setSettings] = useState(readPitchSettings);
  return <WorkshopPage title={EXERCISE_TITLE} blurb="Hear a note, then sing it back in your vocal range."
    overview={OVERVIEW_HELP} modules={MODULES} lessonsForModule={lessonsForModule}
    getLessonResult={getLessonResult} soundControls={null}
    headerAction={<div className="flex flex-col gap-base">
      <PitchSetup microphoneRequirementId="pitch-microphone-required" value={settings} onChange={value => { savePitchSettings(value); setSettings(value); }} />
      <Button asChild variant="outline" className="self-start">
        <Link to="/exercises/pitch-matching/custom"><SlidersHorizontal />Set up custom exercise</Link>
      </Button>
    </div>}
    renderLessonLink={(lessonId, className, children) => microphone.resource ? <Link to="/exercises/pitch-matching/lesson/$lessonId"
      params={{ lessonId }} className={className}>{children}</Link>
      : <button type="button" disabled aria-describedby="pitch-microphone-required"
          className={cn(className, 'w-full cursor-not-allowed text-left [&>span]:pointer-events-none [&>span:first-child]:opacity-60 [&>span:nth-child(2)]:opacity-60')}>{children}
          <span className="flex items-center gap-tight text-body font-semibold text-foreground"><MicOff aria-hidden="true" className="size-5" />Microphone required</span>
        </button>} />;
}
