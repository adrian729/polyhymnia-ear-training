import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { PaperSheet, Worktable } from '@/components/PaperSheet';
import { MicrophoneProvider } from '@/components/audio/MicrophoneProvider';

const RHYTHM_PATHS = ['rhythm', 'pulse-tapping', 'rhythm-tap-back', 'rhythm-reading', 'silent-bar-timing'];

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorFallback,
  notFoundComponent: RootNotFoundFallback,
});

function RootLayout() {
  // Location can change while the previous Outlet is still mounted. Scope input
  // to committed matches so its provider follows the screen actually rendering.
  const exercise = useRouterState({ select: state => state.matches.at(-1)?.routeId.split('/')[2] ?? '' });
  const scope = RHYTHM_PATHS.includes(exercise) ? 'rhythm' : ['pitch', 'pitch-matching'].includes(exercise) ? 'pitch' : undefined;
  return (
    <Worktable>
      <main>
        {scope ? <MicrophoneProvider key={scope}><Outlet /></MicrophoneProvider> : <Outlet />}
      </main>
    </Worktable>
  );
}

function RootNotFoundFallback() {
  return (
    <PaperSheet size="message" className="flex flex-col items-center px-base py-section text-center">
      <p>Not Found</p>
    </PaperSheet>
  );
}

function RootErrorFallback() {
  return (
    <Worktable>
      <PaperSheet size="message">
        <main className="flex flex-col items-center gap-base px-base py-section text-center">
          <p>Something went wrong.</p>
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </main>
      </PaperSheet>
    </Worktable>
  );
}
