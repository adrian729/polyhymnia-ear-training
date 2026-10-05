import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { useState } from 'react';
import { PitchSetup } from '@/components/audio/PitchSetup';
import { readPitchSettings, savePitchSettings } from '@/exercises/pitch-matching/settings';

export const Route = createFileRoute('/exercises/pitch')({
  component: PitchPage,
});

function PitchPage() {
  const [settings, setSettings] = useState(readPitchSettings);
  return <ExerciseGroupPage groupId="pitch" settings={<PitchSetup value={settings}
    onChange={value => { savePitchSettings(value); setSettings(value); }} />} />;
}
