import { cn } from 'cn/vite';

/**
 * `cn build`: class-merge tables fitted to the classes the sources use and to the theme's scales,
 * which therefore live in styles/theme.css
 * (so `text-meta` merges as a size, never a colour), written to the gitignored src/generated on
 * every dev start, build and test run, and kept current while dev runs. Shared by vite.config.ts
 * and vitest.config.ts so both compile the same tables.
 */
export const cnTables = () =>
  // The theme file, not index.css: that imports generated CSS which may not exist yet (Vite runs
  // plugin start hooks in parallel, and Vitest runs no font plugin at all).
  cn({ content: ['src/**/*.{ts,tsx}', 'index.html'], css: 'src/styles/theme.css', out: 'src/generated/cn-tables.mjs' });
