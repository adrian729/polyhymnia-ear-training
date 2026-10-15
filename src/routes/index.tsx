import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { FRAMED_LOGO } from '@/lib/logo';
import { frameAsset, imageAsset } from '@/lib/assets';
import { warmImage } from '@/lib/warmup';
import { PolyhymniaName } from '@/components/PolyhymniaName';
import { ExerciseIndexList } from '@/components/ExerciseIndexList';
import { EXERCISE_GROUPS } from '@/exercises/groups';
import { Sheet } from '@/components/SheetLayout';
import { BarBorder, FlourishRule, Ornament, OrnamentRule } from '@/components/Ornament';
import { BorderFrame } from '@/components/BorderFrame';
import { OrnamentImage } from '@/components/OrnamentImage';
import { NearView } from '@/components/NearView';
import { ResponsiveImage } from '@/components/ResponsiveImage';
// Generated from scripts/ornament-selection.json; see scripts/asset-manifest.ts. The Cantigas
// de Santa María miniature is sized from its lossless master at build time.
import illustrations from '@/generated/assets/illustrations';
import frames from '@/generated/assets/frames';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const ANAFILES = imageAsset(illustrations, 'anafiles');
const HERO_FRAME = frameAsset(frames, 'hero-frame');
// The miniature sits at the foot of the page; warm it once the first screen is idle, so a reader who
// scrolls down finds it already cached instead of watching it load.
const ANAFILES_SIZES = '(min-width: 30rem) 24rem, 100vw';
warmImage(ANAFILES.src, ANAFILES.srcSet, ANAFILES_SIZES);

// The score sits at the foot of the page. Its code and font download once the first screen is shown
// and the browser is idle; from then on it lays out and renders a viewport before the reader reaches it.
const loadScore = () => import('@/components/SaltarelloScore');
const SaltarelloScore = lazy(loadScore);
const prepareScore = () => loadScore().then(score => score.prepare());

function HomePage() {
  return (
    <Sheet className="flex flex-col gap-section px-base pt-base pb-section">
      <div className="rubricated font-specimen flex items-baseline justify-between border-b border-border pb-tight text-meta text-muted-foreground">
        <PolyhymniaName />
        <span>Ear training</span>
      </div>

      <BorderFrame asset={HERO_FRAME}>
        <header className="flex flex-col items-center gap-base text-center">
          <ResponsiveImage {...FRAMED_LOGO} placement="above-fold" sizes="(min-width: 40rem) 12rem, 10rem" alt="" width={1254} height={1254} className="h-auto w-40 sm:w-48" />
          <div className="flex flex-col items-center gap-tight">
            <h1 aria-label="Polyhymnia" className="font-display text-title sm:text-display">
              <PolyhymniaName illuminated />
            </h1>
            <p className="max-w-[52ch] text-body text-muted-foreground">
              Ear training for musicians: the difference between reading music and hearing it.
            </p>
          </div>
          <OrnamentRule name="fleur-de-lis" className="w-full max-w-md" />
        </header>
      </BorderFrame>

      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="rubricated font-specimen text-subhead text-muted-foreground">
          Exercises
        </h2>
        <FlourishRule />
        <ExerciseIndexList entries={EXERCISE_GROUPS} />
        <FlourishRule />
      </section>

      <footer className="flex flex-col gap-loose">
        <OrnamentImage
          asset={ANAFILES}
          sizes={ANAFILES_SIZES}
          alt="Two heralds blowing long trumpets, from the Cantigas de Santa María"
          placement="below-fold"
          className="mx-auto h-auto w-full max-w-sm"
        />
        <Ornament name="running-vine" className="mx-auto h-8 w-64 text-primary-strong" />
        <BarBorder>
          <NearView prepare={prepareScore}>
            <Suspense>
              <SaltarelloScore />
            </Suspense>
          </NearView>
        </BarBorder>
      </footer>
    </Sheet>
  );
}
