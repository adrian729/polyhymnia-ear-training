import { defineConfig } from 'vitest/config';
import { cnTables } from './scripts/cn-tables.ts';

export default defineConfig({
  plugins: [cnTables()],
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
