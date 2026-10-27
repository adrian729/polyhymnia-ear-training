import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { applyTransforms, builtins, generateTransforms } from 'vite-imagetools';
import { describe, expect, it } from 'vitest';
import { extractTransform, generateAssets } from '../scripts/asset-manifest.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = 'src/generated/assets';

interface Master { w: number; h: number; path: string }
interface Entry { id: string; role: string; atlas?: { crop: number[]; slicePx: number } }

const readJson = <T,>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
const copyDir = (root: string) => resolve(root, readJson<{ out?: string }>(join(root, 'ducktape.json')).out ?? 'src/assets/ducktape');
const mastersOf = (root: string) =>
  readJson<{ assets: Record<string, { files: { master?: Master } }> }>(join(copyDir(root), 'ducktape.manifest.json')).assets;

/** A frame whose 3x copies would exceed its small atlas, cut from a master with margins. */
const FIXTURE_MASTER: Master = { w: 240, h: 60, path: 'fixture/masters/thin-frame.webp' };
const FIXTURE_SELECTION = [
  { group: 'frames', name: 'thin', id: 'fixture/thin-frame', role: 'frame', thicknessesPx: [28, 40], atlas: { crop: [10, 15, 220, 30], slicePx: 13 } },
];

function fixtureRoot(selection: object[] = FIXTURE_SELECTION, master = FIXTURE_MASTER): string {
  const root = mkdtempSync(join(tmpdir(), 'asset-manifest-'));
  const copied = join(root, 'art');
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(copied, 'fixture/masters'), { recursive: true });
  writeFileSync(join(root, 'scripts/ornament-selection.json'), JSON.stringify(selection));
  writeFileSync(join(root, 'ducktape.json'), JSON.stringify({ out: 'art', assets: [] }));
  writeFileSync(join(copied, master.path), '');
  const assets = Object.fromEntries((selection as Entry[]).map(entry => [entry.id, { set: 'fixture', version: '1.0.0', files: { master } }]));
  writeFileSync(join(copied, 'ducktape.manifest.json'), JSON.stringify({ schema: 1, assets }));
  return root;
}

/** Every generated image import, with the size of the region it is drawn from. */
function generatedImports(root: string) {
  const masters = new Map(Object.values(mastersOf(root)).flatMap(({ files }) => files.master ? [[resolve(copyDir(root), files.master.path), files.master] as const] : []));
  return readdirSync(join(root, OUT)).flatMap(file =>
    [...readFileSync(join(root, OUT, file), 'utf8').matchAll(/import (\w+) from '([^'?]+)\?([^']*)'/g)]
      .map(([, name, path, query]) => {
        const params = new URLSearchParams(query);
        const master = masters.get(resolve(root, OUT, path!));
        const [, , w, h] = params.get('extract')?.split(',').map(Number) ?? [];
        return { file, name: name!, path: path!, query: params, region: master && { width: w ?? master.w, height: h ?? master.h } };
      }));
}

describe('asset manifest', () => {
  it('resolves every selection entry and writes a module per group', () => {
    const { groups } = generateAssets(ROOT);
    expect(groups.length).toBeGreaterThan(0);
    expect(readdirSync(join(ROOT, OUT)).sort()).toEqual(groups.map(group => `${group}.ts`).sort());
  });

  it.each([['the app selection', ROOT], ['a frame that would upscale', fixtureRoot()]])(
    'sizes every copy at build time and never above its master: %s',
    (_, root) => {
      generateAssets(root);
      const imports = generatedImports(root);
      expect(imports.length).toBeGreaterThan(0);
      for (const { file, path, query, region } of imports) {
        expect(region, `${file}: ${path} is not a copied master`).toBeDefined();
        expect(query.has('format') && (query.has('w') || query.has('h')), `${file}: ${path} is unsized`).toBe(true);
        for (const [side, limit] of [['w', region!.width], ['h', region!.height]] as const) {
          for (const size of query.get(side)?.split(';') ?? []) expect(Number(size), `${file}: ${path} ${side}=${size}`).toBeLessThanOrEqual(limit);
        }
      }
    },
  );

  it('passes a flourish through alongside the responsive image', () => {
    const flourish = { join: [20, 150], text: [160, 150], safeHalfHeight: 12 };
    const root = fixtureRoot([
      { group: 'titles', name: 'title', id: 'fixture/title', role: 'image', widths: [200, 400], flourish },
    ], { w: 600, h: 320, path: 'fixture/masters/title.webp' });
    generateAssets(root);
    const source = readFileSync(join(root, OUT, 'titles.ts'), 'utf8');
    expect(source).toContain(`flourish: ${JSON.stringify(flourish)}`);
    expect(generatedImports(root).some(({ query }) => query.get('as') === 'srcset')).toBe(true);
  });

  it('draws a frame at the slice and from the atlas its entry declares, so a change cannot cut motifs', () => {
    generateAssets(ROOT);
    const generated = readFileSync(join(ROOT, OUT, 'frames.ts'), 'utf8');
    for (const { atlas } of readJson<Entry[]>(join(ROOT, 'scripts/ornament-selection.json')).filter(entry => entry.role === 'frame')) {
      expect(generated).toContain(String((atlas!.slicePx / atlas!.crop[2]!) * 100));
      expect(generated).toContain(`extract=${atlas!.crop.join(',')}&`);
    }
  });

  // autoOrient used to reset the size to the whole master, so the copy kept the master's aspect.
  it('cuts the atlas before resizing a copy', async () => {
    const master = sharp({ create: { width: 400, height: 300, channels: 4, background: '#0000' } }).webp();
    const config = { extract: '20,50,200,100', w: '100', format: 'webp' };
    const { transforms } = generateTransforms(config, [extractTransform as typeof builtins[number], ...builtins], new URLSearchParams(config));
    const { image } = await applyTransforms(transforms, sharp(await master.toBuffer()));
    const { info } = await image.toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([100, 50]);
  });
});
