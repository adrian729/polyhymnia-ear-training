import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { useState } from 'react';
import { PitchSetup } from '@/components/audio/PitchSetup';
import { OrnamentImage } from '@/components/OrnamentImage';
import { readPitchSettings, savePitchSettings } from '@/exercises/pitch-matching/settings';
import { imageAsset } from '@/lib/assets';
import illustrations from '@/generated/assets/illustrations';

export const Route = createFileRoute('/exercises/pitch')({
  component: PitchPage,
});

// A cat reading its book, looking up as if to sing from it.
const CAT_READING = imageAsset(illustrations, 'cat-reading');
// A herd singing from an open score.
const ANIMAL_CHOIR = imageAsset(illustrations, 'animal-choir');

function PitchPage() {
  const [settings, setSettings] = useState(readPitchSettings);
  return <ExerciseGroupPage
    groupId="pitch"
    settings={<PitchSetup value={settings}
      onChange={value => { savePitchSettings(value); setSettings(value); }} />}
    illustration={
      <OrnamentImage
        asset={CAT_READING}
        sizes="(min-width: 40rem) 7rem, 6rem"
        alt="A cat with its paw on an open book"
        placement="above-fold"
        className="h-auto w-24 shrink-0 sm:-mb-8 sm:w-28 sm:-translate-y-4"
      />
    }
    closing={
      <OrnamentImage
        asset={ANIMAL_CHOIR}
        sizes="(min-width: 34rem) 32rem, 100vw"
        alt="Cattle singing from a book on a lectern while two birds fly overhead"
        placement="below-fold"
        className="mx-auto h-auto w-full max-w-lg"
      />
    }
  />;
}
