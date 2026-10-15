import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { OrnamentImage } from '@/components/OrnamentImage';
import { imageAsset } from '@/lib/assets';
import illustrations from '@/generated/assets/illustrations';

export const Route = createFileRoute('/exercises/chords')({
  component: ChordsPage,
});

// An organ, the instrument that sounds chords.
const DONKEY_ORGANIST = imageAsset(illustrations, 'donkey-organist');
// Many voices sounding together.
const ANIMAL_MUSICIANS = imageAsset(illustrations, 'animal-musicians-ensemble');

function ChordsPage() {
  return (
    <ExerciseGroupPage
      groupId="chords"
      illustration={
        <OrnamentImage
          asset={DONKEY_ORGANIST}
          sizes="(min-width: 40rem) 7rem, 6rem"
          alt="A donkey playing a pipe organ"
          placement="above-fold"
          className="h-auto w-24 shrink-0 sm:w-28 sm:-translate-y-4"
        />
      }
      closing={
        <OrnamentImage
          asset={ANIMAL_MUSICIANS}
          sizes="(min-width: 30rem) 24rem, 100vw"
          alt="Animals making music together around an open score: a bowed string player, a donkey at an organ, geese and a fox"
          placement="below-fold"
          className="mx-auto h-auto w-full max-w-sm"
        />
      }
    />
  );
}
