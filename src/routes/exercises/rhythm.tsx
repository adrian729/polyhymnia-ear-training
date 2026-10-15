import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { useState } from 'react';
import { TimingSetup } from '@/components/rhythm/TimingSetup';
import { OrnamentImage } from '@/components/OrnamentImage';
import { readTimingPreferences, saveTimingPreferences } from '@/exercises/shared/rhythm/store';
import { imageAsset } from '@/lib/assets';
import illustrations from '@/generated/assets/illustrations';

export const Route = createFileRoute('/exercises/rhythm')({
  component: RhythmPage,
});

// Pipe and tabor: one player keeping the beat on the drum while piping the tune.
const HORSE_PIPE_AND_TABOR = imageAsset(illustrations, 'horse-pipe-and-tabor');
// The blue platform is centred about 59% across the artwork; offset the image by 9% to centre it.
const MUSICIANS_AND_DANCERS = imageAsset(illustrations, 'musicians-and-dancers');

function RhythmPage() {
  const [preferences, setPreferences] = useState(readTimingPreferences);
  return <ExerciseGroupPage
    groupId="rhythm"
    settings={<TimingSetup value={preferences}
      onChange={value => { saveTimingPreferences(value); setPreferences(value); }} />}
    illustration={
      <OrnamentImage
        asset={HORSE_PIPE_AND_TABOR}
        sizes="(min-width: 40rem) 5rem, 4rem"
        alt="A horse playing a pipe and a small drum"
        placement="above-fold"
        className="h-auto w-16 shrink-0 sm:-mb-14 sm:w-20 sm:-translate-y-4"
      />
    }
    closing={
      <OrnamentImage
        asset={MUSICIANS_AND_DANCERS}
        sizes="(min-width: 34rem) 32rem, 100vw"
        alt="A bagpiper and a drummer playing for a line of dancers"
        placement="below-fold"
        className="mx-auto h-auto w-full max-w-lg -translate-x-[9%]"
      />
    }
  />;
}
