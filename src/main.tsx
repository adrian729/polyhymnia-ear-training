import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import '@polyhymnia/notation-react/styles.css';
import './index.css';

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
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

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
