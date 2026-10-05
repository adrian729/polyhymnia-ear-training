import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
