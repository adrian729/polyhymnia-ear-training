import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { Flourish } from '../src/lib/assets.ts';

/*
 * Turns a hand-curated selection (scripts/ornament-selection.json) into per-group asset modules
 * under the gitignored src/generated/assets. Each entry names a Ducktape Assets id; the lossless
 * master comes from the copy command (`pnpm exec ducktape-assets copy`, configured by ducktape.json),
 * which writes the masters and ducktape.manifest.json under the config's `out`. From the manifest it
 * takes the facts the app must not hardcode (the master's size and path) and emits vite-imagetools
 * imports sized the way the app draws them: lossy WebP for images and masks, AVIF for fine-coloured
 * art and frames, and never an upscale (a copy a dense screen would need beyond the master is the
 * master).
 *
 * A frame's border-image slice comes from the copy manifest (render.frame), where the library
 * declares it for the master. The one thing the library does not carry is the points a heading's text
 * and rules align to on a flourish; that stays in the selection entry (`flourish`), in master pixels,
 * and is checked against the master here.
 *
 * This is the one place an ornament is added. Components read the generated group; nothing else
 * names a master. Run at dev/build/test start (vite.config.ts, vitest.config.ts), like the fonts,
 * and again whenever the dev server sees the selection or the copied manifest change.
 */

const OUT_DIR = 'src/generated/assets';
const SELECTION = 'scripts/ornament-selection.json';
const CONFIG = 'ducktape.json';
const DEFAULT_COPY_DIR = 'src/assets/ducktape';
const GENERATOR = 'scripts/asset-manifest.ts';

const ROLES = ['mask', 'image', 'frame', 'divider'] as const;
type Role = typeof ROLES[number];

const DEFAULT_QUALITY: Record<Role, number> = { mask: 82, image: 82, frame: 60, divider: 82 };
const AVIF_QUALITY = 60;

interface SelectionEntry {
  group: string;
  name: string;
  /** The Ducktape Assets id, `<set>/<asset>`, listed in ducktape.json with `masters: true`. */
  id: string;
  role: Role;
  /** image: the widths the srcset offers. */
  widths?: number[];
  /** image: `avif` for fine-coloured painted art, which WebP's half-resolution colour greys. */
  format?: 'webp' | 'avif';
  /** Lossy encode quality. */
  quality?: number;
  /** frame/divider: the drawn border or strip width in CSS pixels; one, or a narrow one and the wider
   *  one drawn from the `sm` breakpoint up. */
  thicknessesPx?: number[];
  /** image: where a heading's text and rules meet the art, in master pixels. */
  flourish?: Flourish;
}

/** One asset of ducktape.manifest.json, as the copy command writes it. */
interface CopiedAsset {
  set: string;
  version: string;
  type: string;
  transparent: boolean | null;
  render: { frame?: { slice: { top: number; right: number; bottom: number; left: number }; slicePx: number } };
  files: { master?: { w: number; h: number; path: string } };
}

interface Master {
  /** The import path, relative to the generated modules. */
  path: string;
  width: number;
  height: number;
  /** frame: the library's border-image slice for this master. */
  frame?: NonNullable<CopiedAsset['render']['frame']>;
}

/** Names one import per distinct specifier, so copies capped at the same size share a file. */
type Use = (path: string, query: string) => string;

function fail(entry: Pick<SelectionEntry, 'group' | 'name'>, message: string): never {
  throw new Error(`asset-manifest: ${entry.group}/${entry.name}: ${message}`);
}

/** The copied directory and its manifest, as ducktape.json places them. */
function readCopied(root: string): { dir: string; assets: Record<string, CopiedAsset> } {
  const config = JSON.parse(readFileSync(join(root, CONFIG), 'utf8')) as { out?: string };
  const dir = resolve(root, config.out ?? DEFAULT_COPY_DIR);
  const file = join(dir, 'ducktape.manifest.json');
  if (!existsSync(file)) throw new Error(`asset-manifest: ${relative(root, file)} is missing; run \`pnpm exec ducktape-assets copy\`.`);
  return { dir, assets: (JSON.parse(readFileSync(file, 'utf8')) as { assets: Record<string, CopiedAsset> }).assets };
}

/** The ladder rungs a mask is generated at: fixed steps up to the master, never above it. */
function maskRungs(height: number): number[] {
  return [...[32, 64, 128, 256, 512, 768].filter(step => step < height), height];
}

/** The drawn thicknesses: one, or narrow then wide, which is all BorderFrame and Divider draw. */
function thicknesses(entry: SelectionEntry): number[] {
  const drawn = entry.thicknessesPx ?? [];
  if (drawn.length < 1 || drawn.length > 2 || (drawn.length === 2 && drawn[1]! <= drawn[0]!)) {
    fail(entry, 'thicknessesPx takes one width, or a narrow one and a wider one (drawn from the sm breakpoint up).');
  }
  return drawn;
}

/** The 1x/2x/3x copies of one drawn size: `drawn` CSS px along `side`, each capped at the master's. */
function densities(use: Use, path: string, side: 'w' | 'h', drawn: number, master: number, encode: string): string {
  const copies = [1, 2, 3].map(density => `'${density}x': ${use(path, `${side}=${Math.min(Math.round(drawn * density), master)}&${encode}`)}`);
  return `{ ${copies.join(', ')} }`;
}

function emitMask(entry: SelectionEntry, master: Master, use: Use, q: number): string {
  const rungs = maskRungs(master.height);
  // One rung imports as an object, several as an array.
  const ladder = use(master.path, `h=${rungs.join(';')}&quality=${q}&format=webp&as=metadata:src;width;height`);
  return `ladder: [${ladder}].flat().sort((a, b) => a.height - b.height)`;
}

function emitImage(entry: SelectionEntry, master: Master, use: Use, q: number): string {
  const widths = [...new Set(entry.widths ?? [])].sort((a, b) => a - b);
  if (widths.length < 2) fail(entry, 'an image needs at least two widths.');
  const over = widths.filter(width => width > master.width);
  if (over.length > 0) fail(entry, `widths ${over.join(', ')} exceed the ${master.width}px master; it would be upscaled.`);
  const encode = entry.format === 'avif' ? `quality=${entry.quality ?? AVIF_QUALITY}&format=avif` : `quality=${q}&format=webp`;
  const src = use(master.path, `w=${widths.at(-1)}&${encode}`);
  const srcSet = use(master.path, `w=${widths.join(';')}&${encode}&as=srcset`);
  const flourish = entry.flourish ? `, flourish: ${JSON.stringify(entry.flourish)}` : '';
  return `src: ${src}, srcSet: ${srcSet}, width: ${master.width}, height: ${master.height}${flourish}`;
}

function emitFrame(entry: SelectionEntry, master: Master, use: Use, q: number): string {
  const { slice, slicePx } = master.frame!;
  // The master is drawn at `thickness` px, so a slice of slicePx maps to that width: scale the master by
  // the thickness-to-slice ratio.
  const encode = `quality=${q}&format=avif`;
  const copies = thicknesses(entry).map(thickness =>
    `{ thickness: ${thickness}, images: ${densities(use, master.path, 'w', (thickness * master.width) / slicePx, master.width, encode)} }`);
  // Percentages are relative to each axis, as the library declares them.
  const slices = slice.top === slice.left ? `${slice.left}` : `[${slice.top}, ${slice.left}]`;
  return `slicePercent: ${slices}, copies: [${copies.join(', ')}]`;
}

function emitDivider(entry: SelectionEntry): string {
  // A divider repeats a tile along the strip and a rotated copy across it. Ducktape describes tiles
  // (render.tile), but none is published yet and the copy command brings no rotated master to
  // re-encode, so there is nothing to draw one from.
  fail(entry, 'Ducktape Assets has no repeat tile with a lossless rotated master yet; draw dividers from image pieces (see Acanthus.tsx).');
}

const EMIT: Record<Role, (entry: SelectionEntry, master: Master, use: Use, q: number) => string> = {
  mask: emitMask,
  image: emitImage,
  frame: emitFrame,
  divider: emitDivider,
};

function renderGroup(entries: { entry: SelectionEntry; master: Master }[]): string {
  const imports = new Map<string, string>();
  const bodies: string[] = [];
  for (const { entry, master } of entries) {
    const use: Use = (path, query) => {
      const specifier = `${path}?${query}`;
      if (!imports.has(specifier)) imports.set(specifier, `a${imports.size}`);
      return imports.get(specifier)!;
    };
    const body = EMIT[entry.role](entry, master, use, entry.quality ?? DEFAULT_QUALITY[entry.role]);
    bodies.push(`  '${entry.name}': { kind: '${entry.role}', ${body} },`);
  }
  return [
    `// Generated by ${GENERATOR} from ${SELECTION}. Do not edit; rebuilt on dev and build.`,
    `import type { AssetGroup } from '@/lib/assets';`,
    ...[...imports].map(([specifier, name]) => `import ${name} from '${specifier}';`),
    '',
    'const group: AssetGroup = {',
    ...bodies,
    '};',
    '',
    'export default group;',
    '',
  ].join('\n');
}

const inside = (master: { w: number; h: number }, [x, y]: readonly number[]) => x! >= 0 && y! >= 0 && x! <= master.w && y! <= master.h;

function checkEntry(root: string, entry: SelectionEntry, copied: CopiedAsset | undefined, dir: string, seen: Set<string>): Master {
  if (!/^[a-z][a-z0-9-]*$/.test(entry.group)) fail(entry, 'group must be lower-case kebab-case; it names a file.');
  const key = `${entry.group}/${entry.name}`;
  if (seen.has(key)) fail(entry, 'declared twice.');
  seen.add(key);
  if (!ROLES.includes(entry.role)) fail(entry, `role "${entry.role}" is not one of ${ROLES.join(', ')}.`);
  if (entry.format !== undefined && (entry.role !== 'image' || !['webp', 'avif'].includes(entry.format))) fail(entry, 'format is webp or avif, and only for images.');
  if (!copied) fail(entry, `"${entry.id}" is not in ${CONFIG}'s copy; add it with "masters": true and run \`pnpm exec ducktape-assets copy\`.`);
  const master = copied.files.master;
  if (!master) fail(entry, `"${entry.id}" was copied without its master; set "masters": true in ${CONFIG}.`);
  const file = join(dir, master.path);
  if (!existsSync(file)) fail(entry, `${relative(root, file)} is missing; run \`pnpm exec ducktape-assets copy\`.`);
  if (entry.role === 'mask' && copied.transparent !== true) fail(entry, `"${entry.id}" has no transparency, so it cannot be a mask.`);
  const frame = copied.render.frame;
  if (entry.role === 'frame') {
    if (!frame) fail(entry, `"${entry.id}" declares no render.frame in the library, so it cannot be a frame.`);
    if (frame.slicePx * 2 >= Math.min(master.w, master.h)) fail(entry, 'the library slice leaves no edge between the corners.');
  }
  if (entry.flourish) {
    const { join: junction, text } = entry.flourish;
    if (entry.role !== 'image') fail(entry, 'flourish is only for images.');
    if (!inside(master, junction) || (text && !inside(master, text))) fail(entry, `flourish points fall outside the ${master.w}x${master.h} master.`);
  }
  return { path: relative(resolve(root, OUT_DIR), file), width: master.w, height: master.h, ...(entry.role === 'frame' ? { frame } : {}) };
}

/** Writes one module per group, rewriting only those that changed and removing stale ones. */
export function generateAssets(root = process.cwd()): { groups: string[] } {
  const selection = JSON.parse(readFileSync(join(root, SELECTION), 'utf8')) as SelectionEntry[];
  const copied = readCopied(root);
  const grouped = new Map<string, { entry: SelectionEntry; master: Master }[]>();
  const seen = new Set<string>();
  for (const entry of selection) {
    const master = checkEntry(root, entry, copied.assets[entry.id], copied.dir, seen);
    grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), { entry, master }]);
  }
  // Everything renders before anything is written, so a selection mistake leaves the last good output.
  const sources = new Map([...grouped].map(([group, entries]) => [`${group}.ts`, renderGroup(entries)]));

  const out = resolve(root, OUT_DIR);
  mkdirSync(out, { recursive: true });
  for (const file of readdirSync(out)) if (!sources.has(file)) rmSync(join(out, file), { recursive: true, force: true });
  // Unchanged modules are left alone, so a running dev server reloads only what changed.
  for (const [file, source] of sources) {
    const path = join(out, file);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== source) writeFileSync(path, source);
  }
  return { groups: [...grouped.keys()] };
}

/** Generates the asset modules at config load, so they exist before any import is resolved. */
export function assetManifest(): Plugin {
  let root = process.cwd();
  return {
    name: 'asset-manifest',
    configResolved(config) {
      root = config.root;
      generateAssets(root);
    },
    configureServer(server) {
      // An edited selection or a new copy regenerates the modules, and Vite reloads what imports them.
      // A mistake is reported and keeps the last good modules instead of stopping the server.
      const watched = [resolve(root, SELECTION), join(readCopied(root).dir, 'ducktape.manifest.json')];
      server.watcher.add(watched);
      server.watcher.on('change', file => {
        if (!watched.includes(resolve(file))) return;
        try {
          generateAssets(root);
        } catch (error) {
          server.config.logger.error(`[asset-manifest] ${error instanceof Error ? error.message : String(error)}`, { timestamp: true });
        }
      });
    },
  };
}
