import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { FRAMED_LOGO } from '@/lib/logo';
import { frameAsset, imageAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { PolyhymniaName } from '@/components/PolyhymniaName';
import { ExerciseIndexList } from '@/components/ExerciseIndexList';
import { EXERCISE_GROUPS } from '@/exercises/groups';
import { Sheet } from '@/components/SheetLayout';
import { AcanthusFleuron, AcanthusRule } from '@/components/Acanthus';
import { BorderFrame } from '@/components/BorderFrame';
import { OrnamentImage } from '@/components/OrnamentImage';
import { NearView } from '@/components/NearView';
import { ResponsiveImage } from '@/components/ResponsiveImage';
// Generated from scripts/ornament-selection.json; see scripts/asset-manifest.ts. The Cantigas
// de Santa María miniature is sized from its lossless master at build time.
import illustrations from '@/generated/assets/illustrations';
import frames from '@/generated/assets/frames';
import decorations from '@/generated/assets/decorations';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const ANAFILES = imageAsset(illustrations, 'anafiles');
const HERO_FRAME = frameAsset(frames, 'hero-frame');
const HERO_CORNERS = [
  { asset: imageAsset(decorations, 'frame-growth-top-left'), position: '-top-2 -left-2 sm:-top-4 sm:-left-4' },
  { asset: imageAsset(decorations, 'frame-growth-top-right'), position: '-top-2 -right-2 sm:-top-4 sm:-right-4' },
  { asset: imageAsset(decorations, 'frame-growth-bottom-left'), position: '-bottom-2 -left-2 sm:-bottom-4 sm:-left-4' },
  { asset: imageAsset(decorations, 'frame-growth-bottom-right'), position: '-right-2 -bottom-2 sm:-right-4 sm:-bottom-4' },
];
const HERO_HEADPIECE = imageAsset(decorations, 'acanthus-headpiece');
// Gilt margin rods from Walters W.171 run down the score's left margin: the upper piece (fol. 19v)
// branches across its top, the lower (fol. 12r) across its foot. The block is tall enough for the two
// rods to meet when the score is short. Their masters are drawn at different scales, so
// each is sized to draw its rod 10 px thick and in the same column (about 33 px in).
const SCORE_ROD_UPPER = imageAsset(decorations, 'gold-rod-upper');
const SCORE_ROD_LOWER = imageAsset(decorations, 'gold-rod-lower');

// The score sits at the foot of the page. Its code and font download once the first screen is shown
// and the browser is idle; from then on it lays out and renders two viewports before the reader reaches it.
const loadScore = () => import('@/components/SaltarelloScore');
const SaltarelloScore = lazy(loadScore);
const prepareScore = () => loadScore().then(score => score.prepare());

function HomePage() {
  return (
    <Sheet className="flex flex-col gap-section px-base pt-base">
      <BorderFrame asset={HERO_FRAME} className="relative">
        {HERO_CORNERS.map(({ asset, position }) => (
          <OrnamentImage
            key={position}
            asset={asset}
            sizes="(min-width: 40rem) 18rem, 7rem"
            placement="above-fold"
            className={cn('pointer-events-none absolute h-auto w-28 max-w-[42%] sm:w-72', position)}
          />
        ))}
        <header className="relative flex flex-col items-center gap-base pb-6 text-center sm:pb-0">
          <ResponsiveImage {...FRAMED_LOGO} placement="above-fold" sizes="(min-width: 40rem) 12rem, 10rem" alt="" width={1254} height={1254} className="h-auto w-40 sm:w-48" />
          <div className="flex flex-col items-center gap-tight">
            <h1 aria-label="Polyhymnia" className="font-display text-title sm:text-display">
              <PolyhymniaName illuminated />
            </h1>
            <p className="max-w-[52ch] text-body text-muted-foreground">
              Ear training for musicians: the difference between reading music and hearing it.
            </p>
          </div>
          <OrnamentImage asset={HERO_HEADPIECE} sizes="(min-width: 40rem) 14rem, 10rem" placement="above-fold" className="h-auto w-40 sm:w-56" />
        </header>
      </BorderFrame>

      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="text-center font-display text-subhead text-primary-strong">
          Exercises
        </h2>
        <AcanthusRule placement="below-fold" />
        <ExerciseIndexList entries={EXERCISE_GROUPS} />
        <AcanthusRule placement="below-fold" flipEnds />
      </section>

      <footer className="-mt-base flex flex-col gap-loose">
        <OrnamentImage
          asset={ANAFILES}
          sizes="(min-width: 30rem) 24rem, 100vw"
          alt="Two heralds blowing long trumpets, from the Cantigas de Santa María"
          placement="below-fold"
          // At the foot of the page: a reader who scrolls down finds it already cached.
          warm
          className="mx-auto h-auto w-full max-w-sm"
        />
        <div className="relative flex min-h-84 flex-col justify-center py-12 pl-16">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col items-start justify-between">
            <OrnamentImage asset={SCORE_ROD_UPPER} sizes="11.0625rem" placement="below-fold" className="h-auto w-[11.0625rem] shrink-0" />
            <OrnamentImage asset={SCORE_ROD_LOWER} sizes="9.875rem" placement="below-fold" className="ml-[0.9375rem] h-auto w-[9.875rem] shrink-0" />
          </div>
          <p className="mb-base text-center text-balance font-display text-subhead text-primary-strong">Saltarello · Italian, 14th century</p>
          <NearView prepare={prepareScore}>
            <Suspense>
              <SaltarelloScore />
            </Suspense>
          </NearView>
        </div>
        <AcanthusFleuron className="-mt-4" />
      </footer>
    </Sheet>
  );
}
