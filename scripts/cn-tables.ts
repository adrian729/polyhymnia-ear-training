import { cn } from 'cn/vite';

/**
 * `cn build`: class-merge tables fitted to the classes the sources use and to the theme's scales
 * (so `text-meta` merges as a size, never a colour), written to the gitignored src/generated on
 * every dev start, build and test run, and kept current while dev runs. Shared by vite.config.ts
 * and vitest.config.ts so both compile the same tables.
 */
export const cnTables = () =>
  cn({ content: ['src/**/*.{ts,tsx}', 'index.html'], css: 'src/index.css', out: 'src/generated/cn-tables.mjs' });
