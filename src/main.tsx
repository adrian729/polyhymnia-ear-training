import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { preloadSheetArtwork, preloadSidebarArtwork } from '@/components/PaperSheet';
import { preloadInitials } from '@/lib/fonts';
import { holdFirstPaint, whenIdle } from '@/lib/first-paint';
import '@polyhymnia/notation-react/styles.css';
import './index.css';

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  // Back and forward return to where the reader was; new navigations start at the top. The sheet
  // panes persist across routes (SheetLayout), so they reset and restore with the window.
  scrollRestoration: true,
  scrollRestorationBehavior: 'instant',
  scrollToTopSelectors: ['.sheet-pane-main', '.sheet-pane-aside'],
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// A deploy replaces every hashed chunk on GitHub Pages. A page loaded before it would fail to open a
// route whose chunk it had not fetched yet; reload into the new build instead, at most once a minute.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const key = 'polyhymnia:chunk-reload';
    if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 60_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

// The first screen's artwork starts at once. What later pages need waits until that screen is shown,
// its artwork has arrived and the browser is idle, so it never competes with the first screen.
const firstScreenArtwork = preloadSheetArtwork();

const rootElement = document.getElementById('root')!;

void Promise.all([firstScreenArtwork, holdFirstPaint(rootElement)]).then(() => whenIdle(() => {
  preloadSidebarArtwork();
  preloadInitials();
}));
createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
