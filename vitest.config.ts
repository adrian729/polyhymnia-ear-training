import { defineConfig } from 'vitest/config';
import { assetManifest } from './scripts/asset-manifest.ts';
import { cnTables } from './scripts/cn-tables.ts';

export default defineConfig({
  plugins: [cnTables(), assetManifest()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
