import { createFileRoute } from '@tanstack/react-router';
import { ExerciseGroupPage } from '@/components/ExerciseGroupPage';
import { OrnamentImage } from '@/components/OrnamentImage';
import { imageAsset } from '@/lib/assets';
import illustrations from '@/generated/assets/illustrations';

export const Route = createFileRoute('/exercises/intervals')({
  component: IntervalsPage,
});

// The rabbit faces left, toward the title it sits beside.
const BUNNY_TRUMPET = imageAsset(illustrations, 'bunny-trumpet');
const ANAFILES = imageAsset(illustrations, 'anafiles');

function IntervalsPage() {
  return (
    <ExerciseGroupPage
      groupId="intervals"
      illustration={
        <OrnamentImage
          asset={BUNNY_TRUMPET}
          sizes="(min-width: 40rem) 9rem, 7rem"
          alt="A rabbit playing a long trumpet"
          placement="above-fold"
          className="h-auto w-28 shrink-0 sm:w-36 sm:-translate-y-8"
        />
      }
      closing={
        <OrnamentImage
          asset={ANAFILES}
          sizes="(min-width: 30rem) 24rem, 100vw"
          alt="Two heralds blowing long trumpets, from the Cantigas de Santa María"
          placement="below-fold"
          className="mx-auto h-auto w-full max-w-sm"
        />
      }
    />
  );
}
