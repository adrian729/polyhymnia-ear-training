import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function sources(dir = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'generated' ? [] : sources(path);
    return extname(entry.name) === '.tsx' ? [path] : [];
  });
}

// A page that drew its own paper would mount a new sheet on every navigation, and the paper would
// blink out and redraw. Pages describe their sheet with <Sheet>; only the layout draws paper.
const DRAWS_PAPER = new Set(['components/SheetLayout.tsx', 'components/PaperSheet.tsx']);

it('only the sheet layout draws paper', () => {
  const offenders = sources().map(file => relative(SRC, file)).filter(file =>
    !DRAWS_PAPER.has(file) && /<(PaperSheet|Parchment)\b/.test(readFileSync(join(SRC, file), 'utf8')));
  expect(offenders).toEqual([]);
});
