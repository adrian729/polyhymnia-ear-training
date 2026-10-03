import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { PaperSheet, Worktable } from '@/components/PaperSheet';

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorFallback,
  notFoundComponent: RootNotFoundFallback,
});

function RootLayout() {
  return (
    <Worktable>
      <main>
        <Outlet />
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
