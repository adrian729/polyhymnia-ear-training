import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateAssets } from '../scripts/asset-manifest.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = 'src/generated/assets';

interface Raster { webp?: string; width: number; height: number }
type Design = Raster & { name: string; components?: Record<string, Raster> };

const designsOf = (catalog: Design[] | { designs: Record<string, Design> }) => Array.isArray(catalog) ? catalog : Object.values(catalog.designs);

/** A package no page uses: a frame whose 3x copies would exceed its small atlas, and a divider whose
 *  tile repeats down (axis y), so its horizontal strip must come from the rotated tile. */
const FIXTURE_PACKAGE = '@fixture/borders';
const FIXTURE_CATALOG: object[] = [
  {
    name: 'thin-frame', webp: 'webp/thin-frame.webp', width: 162, height: 29, uses: ['frame'],
    border_image_slice_percent: 13.18, repeat_axis: 'x',
    components: { border_image: { webp: 'webp/thin-frame-border.webp', width: 220, height: 220, slice_pixels: 29 } },
  },
  {
    name: 'upright-divider', webp: 'webp/upright-divider.webp', width: 262, height: 335, uses: ['divider'], repeat_axis: 'y',
    components: { rotated_tile: { webp: 'webp/upright-divider-rotated.webp', width: 335, height: 262 } },
  },
];
const FIXTURE_SELECTION = [
  { group: 'frames', name: 'thin', package: FIXTURE_PACKAGE, design: 'thin-frame', role: 'frame', thicknessesPx: [28, 40] },
  { group: 'dividers', name: 'upright', package: FIXTURE_PACKAGE, design: 'upright-divider', role: 'divider', thicknessesPx: [200, 300] },
];

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'asset-manifest-'));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'node_modules', FIXTURE_PACKAGE), { recursive: true });
  writeFileSync(join(root, 'scripts/ornament-selection.json'), JSON.stringify(FIXTURE_SELECTION));
  writeFileSync(join(root, 'node_modules', FIXTURE_PACKAGE, 'catalog.json'), JSON.stringify(FIXTURE_CATALOG));
  return root;
}

/** Every generated image import, with the master it is drawn from. */
function generatedImports(root: string) {
  const selection = JSON.parse(readFileSync(join(root, 'scripts/ornament-selection.json'), 'utf8')) as { package: string }[];
  const masters = new Map<string, Raster>();
  for (const pkg of new Set(selection.map(entry => entry.package))) {
    for (const design of designsOf(JSON.parse(readFileSync(join(root, 'node_modules', pkg, 'catalog.json'), 'utf8')))) {
      for (const raster of [design, ...Object.values(design.components ?? {})]) if (raster.webp) masters.set(`${pkg}/${raster.webp}`, raster);
    }
  }
  return readdirSync(join(root, OUT)).flatMap(file =>
    [...readFileSync(join(root, OUT, file), 'utf8').matchAll(/import (\w+) from '([^'?]+)\?([^']*)'/g)]
      .map(([, name, path, query]) => ({ file, name: name!, path: path!, query: new URLSearchParams(query), master: masters.get(path!) })));
}

describe('asset manifest', () => {
  it('resolves every selection entry and writes a module per group', () => {
    const { groups } = generateAssets(ROOT);
    expect(groups.length).toBeGreaterThan(0);
    expect(readdirSync(join(ROOT, OUT)).sort()).toEqual(groups.map(group => `${group}.ts`).sort());
  });

  it.each([['the app selection', ROOT], ['a frame and a divider that would upscale', fixtureRoot()]])(
    'sizes every copy at build time and never above its master: %s',
    (_, root) => {
      generateAssets(root);
      const imports = generatedImports(root);
      expect(imports.length).toBeGreaterThan(0);
      for (const { file, path, query, master } of imports) {
        expect(master, `${file}: ${path} is not in its catalog`).toBeDefined();
        expect(query.has('format') && (query.has('w') || query.has('h')), `${file}: ${path} is unsized`).toBe(true);
        for (const [side, limit] of [['w', master!.width], ['h', master!.height]] as const) {
          for (const size of query.get(side)?.split(';') ?? []) expect(Number(size), `${file}: ${path} ${side}=${size}`).toBeLessThanOrEqual(limit);
        }
      }
    },
  );

  it('draws a divider along the tile that repeats in that direction', () => {
    const root = fixtureRoot();
    generateAssets(root);
    const source = readFileSync(join(root, OUT, 'dividers.ts'), 'utf8');
    const paths = new Map(generatedImports(root).filter(({ file }) => file === 'dividers.ts').map(({ name, path }) => [name, path]));
    const [, horizontal, vertical] = /horizontal: \{ '1x': (\w+).*?vertical: \{ '1x': (\w+)/.exec(source)!;
    expect(paths.get(horizontal!)).toBe(`${FIXTURE_PACKAGE}/webp/upright-divider-rotated.webp`);
    expect(paths.get(vertical!)).toBe(`${FIXTURE_PACKAGE}/webp/upright-divider.webp`);
  });

  it('preserves catalog title windows and junctions alongside the responsive image', () => {
    const root = fixtureRoot();
    const geometry = {
      opening: { bounds: [10, 20, 180, 300], join: [20, 150], text: [160, 150], safeHalfHeight: 12 },
      closing: { bounds: [400, 80, 550, 240], join: [540, 160], safeHalfHeight: 10 },
    };
    writeFileSync(join(root, 'node_modules', FIXTURE_PACKAGE, 'catalog.json'), JSON.stringify([
      { name: 'title', webp: 'webp/title.webp', width: 600, height: 320, uses: ['image'], title_flourishes: geometry },
    ]));
    writeFileSync(join(root, 'scripts/ornament-selection.json'), JSON.stringify([
      { group: 'titles', name: 'title', package: FIXTURE_PACKAGE, design: 'title', role: 'image', widths: [200, 400] },
    ]));
    generateAssets(root);
    const source = readFileSync(join(root, OUT, 'titles.ts'), 'utf8');
    expect(source).toContain(`titleFlourishes: ${JSON.stringify(geometry)}`);
    expect(generatedImports(root).some(({ query }) => query.get('as') === 'srcset')).toBe(true);
  });

  it('draws a frame at the slice its catalog declares, so a change cannot cut motifs', () => {
    generateAssets(ROOT);
    const generated = readFileSync(join(ROOT, OUT, 'frames.ts'), 'utf8');
    const selection = JSON.parse(readFileSync(join(ROOT, 'scripts/ornament-selection.json'), 'utf8')) as { design: string; package: string; role: string }[];
    for (const entry of selection.filter(item => item.role === 'frame')) {
      const designs = designsOf(JSON.parse(readFileSync(join(ROOT, 'node_modules', entry.package, 'catalog.json'), 'utf8'))) as (Design & { border_image_slice_percent?: number })[];
      const design = designs.find(item => item.name === entry.design)!;
      expect(design.border_image_slice_percent).toBeTypeOf('number');
      expect(generated).toContain(String(design.border_image_slice_percent));
    }
  });
});
