/// <reference lib="webworker" />
// Built by vite-plugin-pwa (injectManifest, see vite.config.ts) and registered in production only.
// GitHub Pages sends max-age=600 for every file, so without this returning visitors re-check every
// asset each 10 minutes. To retire it from all clients, build with VitePWA({ selfDestroying: true }).
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, matchPrecache, precache } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

const YEAR = 365 * 24 * 60 * 60;
const scope = new URL(self.registration.scope);
const shell = new URL('index.html', scope).href;
const local = (url: URL, path: string) => url.origin === scope.origin && url.pathname.startsWith(scope.pathname + path);

// Only the app shell is precached, and only as the offline fallback below: precacheAndRoute would
// answer "/" from it and hide new deploys. Everything else is cached on first use.
precache(self.__WB_MANIFEST);
cleanupOutdatedCaches();
void self.skipWaiting();
clientsClaim();

// Page loads: every route is the same SPA shell, so fetch the shell itself (GitHub Pages answers deep
// links with a 404 copy of it). Network first, so a deploy shows on the next load; cached when offline.
// Only app routes, which have no file extension: opening a real file (a licence notice) gets the file.
const pages = new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 4, fetchOptions: { cache: 'no-cache' } });
registerRoute(({ request, url }) => request.mode === 'navigate' && !/\.\w+$/.test(url.pathname), async ({ event }) => {
  try {
    return await pages.handle({ event, request: new Request(shell) });
  } catch {
    return (await matchPrecache('index.html')) ?? Response.error();
  }
});

// Build assets carry a content hash in their name, so a cached copy never needs re-checking.
registerRoute(({ url, request }) => request.method === 'GET' && local(url, 'assets/'), new CacheFirst({
  cacheName: 'assets',
  plugins: [
    new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: YEAR, purgeOnQuotaError: true }),
  ],
}));

// Unhashed public files (instrument samples, favicon): served from cache, refreshed in the background.
registerRoute(({ url, request }) => request.method === 'GET' && (local(url, 'samples/') || local(url, 'polyhymnia-favicon.png')),
  new StaleWhileRevalidate({
    cacheName: 'static',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: YEAR, purgeOnQuotaError: true }),
    ],
  }));
