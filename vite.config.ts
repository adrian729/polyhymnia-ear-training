import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';
import { cnTables } from './scripts/cn-tables.ts';
import { favicon } from './scripts/favicon.ts';
import { fontFaces } from './scripts/font-faces.ts';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const packageScope = resolve(appRoot, 'node_modules/@polyhymnia');
// Linked packages can reference fonts/assets outside the app's workspace root.
const packageRoots = existsSync(packageScope) ? readdirSync(packageScope).flatMap(name => {
  const directory = resolve(packageScope, name);
  return existsSync(directory) ? [realpathSync(directory)] : [];
}) : [];

export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  server: { fs: { allow: [appRoot, ...packageRoots] } },
  plugins: [
    fontFaces(),
    cnTables(),
    favicon(),
    // Raster sizes are generated from source art at build time; imports without a query pass through untouched.
    imagetools({ include: /^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp|svg)(\?.*)?$/ }),
    // Lesson loaders read their exercise catalogs; split with the component, so catalogs load with
    // the lesson's own chunk instead of at startup.
    tanstackRouter({ target: 'react', autoCodeSplitting: true, codeSplittingOptions: {
      defaultBehavior: [['loader', 'component'], ['errorComponent'], ['notFoundComponent']],
    } }),
    react(),
    tailwindcss(),
    // Caching for returning visitors (sw/service-worker.ts). Production builds only; not an installable app.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'sw',
      filename: 'service-worker.ts',
      injectRegister: 'script-defer',
      manifest: false,
      injectManifest: { globPatterns: ['index.html'] },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
