import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { useState } from 'react';
import { TimingSetup } from '@/components/rhythm/TimingSetup';
import { readTimingPreferences, saveTimingPreferences } from '@/exercises/shared/rhythm/store';

export const Route = createFileRoute('/exercises/rhythm')({
  component: RhythmPage,
});

function RhythmPage() {
  const [preferences, setPreferences] = useState(readTimingPreferences);
  return <ExerciseGroupPage groupId="rhythm" settings={<TimingSetup value={preferences}
    onChange={value => { saveTimingPreferences(value); setPreferences(value); }} />} />;
}
