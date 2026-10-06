import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { FRAMED_LOGO } from '@/lib/logo';
import { PolyhymniaName } from '@/components/PolyhymniaName';
import { ExerciseIndexList } from '@/components/ExerciseIndexList';
import { EXERCISE_GROUPS } from '@/exercises/groups';
import { Sheet } from '@/components/SheetLayout';
import { BarBorder, FlourishRule, Ornament, OrnamentRule } from '@/components/Ornament';
import { PaintedFrame } from '@/components/PaintedFrame';
import { NearView } from '@/components/NearView';
import { ResponsiveImage } from '@/components/ResponsiveImage';
// Cantigas de Santa María miniature from the medieval-ornaments illustration resource. Display
// sizes are generated at build time from its lossless master.
import anafiles from '@ranx729/medieval-ornaments-assets-illustrations-001/webp/anafiles.webp?w=768&quality=82&format=webp';
import anafilesSrcSet from '@ranx729/medieval-ornaments-assets-illustrations-001/webp/anafiles.webp?w=384;512;768;964&quality=82&format=webp&as=srcset';

export const Route = createFileRoute('/')({
  component: HomePage,
});

// The score sits at the foot of the page: its code, layout and sound load only as it comes near.
const SaltarelloScore = lazy(() => import('@/components/SaltarelloScore'));

function HomePage() {
  return (
    <Sheet className="flex flex-col gap-section px-base pt-base pb-section">
      <div className="rubricated font-specimen flex items-baseline justify-between border-b border-border pb-tight text-meta text-muted-foreground">
        <PolyhymniaName />
        <span>Ear training</span>
      </div>

      <PaintedFrame>
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
      </PaintedFrame>

      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="rubricated font-specimen text-subhead text-muted-foreground">
          Exercises
        </h2>
        <FlourishRule />
        <ExerciseIndexList entries={EXERCISE_GROUPS} />
        <FlourishRule />
      </section>

      <footer className="flex flex-col gap-loose">
        <ResponsiveImage
          src={anafiles}
          srcSet={anafilesSrcSet}
          sizes="(min-width: 30rem) 24rem, 100vw"
          alt="Two heralds blowing long trumpets, from the Cantigas de Santa María"
          width={964}
          height={670}
          placement="below-fold"
          className="mx-auto h-auto w-full max-w-sm"
        />
        <Ornament name="running-vine" className="mx-auto h-8 w-64 text-primary-strong" />
        <BarBorder>
          <NearView>
            <Suspense>
              <SaltarelloScore />
            </Suspense>
          </NearView>
        </BarBorder>
      </footer>
    </Sheet>
  );
}
