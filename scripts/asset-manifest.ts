import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { TitleFlourishes } from '../src/lib/assets.ts';

/*
 * Turns a hand-curated selection (scripts/ornament-selection.json) into per-group asset modules
 * under the gitignored src/generated/assets. For each named design it reads the installed package's
 * catalog.json for the facts the app must not hardcode — intrinsic size, transparency, the frame
 * slice, the repeat axis — and emits vite-imagetools imports sized the way the app draws them:
 * lossy WebP for images, masks and dividers, AVIF for fine-coloured frames, and never an upscale
 * (a copy a dense screen would need beyond the master is the master).
 *
 * This is the one place an ornament is added. Components read the generated group; nothing else
 * names a package. Run at dev/build/test start (vite.config.ts, vitest.config.ts), like the fonts,
 * and again whenever the dev server sees the selection change.
 */

const OUT_DIR = 'src/generated/assets';
const SELECTION = 'scripts/ornament-selection.json';
const GENERATOR = 'scripts/asset-manifest.ts';

const ROLES = ['mask', 'image', 'frame', 'divider'] as const;
type Role = typeof ROLES[number];

const DEFAULT_QUALITY: Record<Role, number> = { mask: 82, image: 82, frame: 60, divider: 82 };
const AVIF_QUALITY = 60;

interface SelectionEntry {
  group: string;
  name: string;
  package: string;
  design: string;
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
}

interface Raster {
  webp?: string;
  width: number;
  height: number;
}

interface CatalogDesign extends Raster {
  name: string;
  title_flourishes?: TitleFlourishes;
  has_transparency?: boolean;
  /** What the package draws the design for: frame, divider, image. */
  uses?: string[];
  border_image_slice_percent?: number;
  repeat_axis?: 'x' | 'y' | 'none';
  components?: {
    border_image?: Raster & { slice_pixels?: number };
    rotated_tile?: Raster;
  };
}

/** Names one import per distinct specifier, so copies capped at the same size share a file. */
type Use = (path: string, query: string) => string;

function fail(entry: Pick<SelectionEntry, 'group' | 'name'>, message: string): never {
  throw new Error(`asset-manifest: ${entry.group}/${entry.name}: ${message}`);
}

function readCatalog(root: string, pkg: string): Map<string, CatalogDesign> {
  const file = join(root, 'node_modules', pkg, 'catalog.json');
  if (!existsSync(file)) throw new Error(`asset-manifest: ${pkg}/catalog.json is missing; is the package installed?`);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as CatalogDesign[] | { designs: Record<string, CatalogDesign> };
  const list = Array.isArray(parsed) ? parsed : Object.values(parsed.designs);
  return new Map(list.map(design => [design.name, design]));
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

function emitMask(entry: SelectionEntry, design: CatalogDesign, use: Use, q: number): string {
  if (!design.webp) fail(entry, `"${design.name}" has no webp master.`);
  if (design.has_transparency !== true) fail(entry, `"${design.name}" has no transparency, so it cannot be a mask.`);
  const rungs = maskRungs(design.height);
  // One rung imports as an object, several as an array.
  const ladder = use(design.webp, `h=${rungs.join(';')}&quality=${q}&format=webp&as=metadata:src;width;height`);
  return `ladder: [${ladder}].flat().sort((a, b) => a.height - b.height)`;
}

function emitImage(entry: SelectionEntry, design: CatalogDesign, use: Use, q: number): string {
  if (!design.webp) fail(entry, `"${design.name}" has no webp master.`);
  const widths = [...new Set(entry.widths ?? [])].sort((a, b) => a - b);
  if (widths.length < 2) fail(entry, 'an image needs at least two widths.');
  const over = widths.filter(width => width > design.width);
  if (over.length > 0) fail(entry, `widths ${over.join(', ')} exceed the ${design.width}px master; it would be upscaled.`);
  const encode = entry.format === 'avif' ? `quality=${entry.quality ?? AVIF_QUALITY}&format=avif` : `quality=${q}&format=webp`;
  const src = use(design.webp, `w=${widths.at(-1)}&${encode}`);
  const srcSet = use(design.webp, `w=${widths.join(';')}&${encode}&as=srcset`);
  const flourishes = design.title_flourishes ? `, titleFlourishes: ${JSON.stringify(design.title_flourishes)}` : '';
  return `src: ${src}, srcSet: ${srcSet}, width: ${design.width}, height: ${design.height}${flourishes}`;
}

function emitFrame(entry: SelectionEntry, design: CatalogDesign, use: Use, q: number): string {
  const border = design.components?.border_image;
  const slicePercent = design.border_image_slice_percent;
  if (!border?.webp || slicePercent === undefined) fail(entry, `"${design.name}" has no border_image atlas.`);
  const slicePx = border.slice_pixels ?? (border.width * slicePercent) / 100;
  // The atlas is drawn at `thickness` px, so a slice of slicePx maps to that width: scale the atlas by
  // the thickness-to-slice ratio.
  const copies = thicknesses(entry).map(thickness =>
    `{ thickness: ${thickness}, images: ${densities(use, border.webp!, 'w', (thickness * border.width) / slicePx, border.width, `quality=${q}&format=avif`)} }`);
  // Percentages are relative to each axis. A rectangular painting needs a different vertical
  // percentage to keep its original square corners and equal border thickness.
  const slices = border.width === border.height ? `${slicePercent}` : `[${slicePx / border.height * 100}, ${slicePercent}]`;
  return `slicePercent: ${slices}, copies: [${copies.join(', ')}]`;
}

function emitDivider(entry: SelectionEntry, design: CatalogDesign, use: Use, q: number): string {
  const rotated = design.components?.rotated_tile;
  if (!design.webp || !rotated?.webp) fail(entry, `"${design.name}" has no repeat tile and rotated tile.`);
  // The tile repeats along its axis and the rotated copy along the other; a strip's thickness is
  // the tile's other side.
  const [horizontal, vertical] = design.repeat_axis === 'y' ? [rotated, design] : [design, rotated];
  const encode = `quality=${q}&format=webp`;
  const copies = thicknesses(entry).map(thickness => `{ thickness: ${thickness}, `
    + `horizontal: ${densities(use, horizontal.webp!, 'h', thickness, horizontal.height, encode)}, `
    + `vertical: ${densities(use, vertical.webp!, 'w', thickness, vertical.width, encode)} }`);
  return `copies: [${copies.join(', ')}]`;
}

const EMIT: Record<Role, (entry: SelectionEntry, design: CatalogDesign, use: Use, q: number) => string> = {
  mask: emitMask,
  image: emitImage,
  frame: emitFrame,
  divider: emitDivider,
};

function renderGroup(entries: { entry: SelectionEntry; design: CatalogDesign }[]): string {
  const imports = new Map<string, string>();
  const bodies: string[] = [];
  for (const { entry, design } of entries) {
    const use: Use = (path, query) => {
      const specifier = `${entry.package}/${path}?${query}`;
      if (!imports.has(specifier)) imports.set(specifier, `a${imports.size}`);
      return imports.get(specifier)!;
    };
    const body = EMIT[entry.role](entry, design, use, entry.quality ?? DEFAULT_QUALITY[entry.role]);
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

function checkEntry(entry: SelectionEntry, design: CatalogDesign | undefined, seen: Set<string>): CatalogDesign {
  if (!/^[a-z][a-z0-9-]*$/.test(entry.group)) fail(entry, 'group must be lower-case kebab-case; it names a file.');
  const key = `${entry.group}/${entry.name}`;
  if (seen.has(key)) fail(entry, 'declared twice.');
  seen.add(key);
  if (!ROLES.includes(entry.role)) fail(entry, `role "${entry.role}" is not one of ${ROLES.join(', ')}.`);
  if (entry.format !== undefined && (entry.role !== 'image' || !['webp', 'avif'].includes(entry.format))) fail(entry, 'format is webp or avif, and only for images.');
  if (!design) fail(entry, `"${entry.design}" is not in ${entry.package}.`);
  // Any transparent design can be a mask; the other roles are the ones the catalog lists it for.
  if (entry.role !== 'mask' && design.uses && !design.uses.includes(entry.role)) {
    fail(entry, `${entry.package} draws "${design.name}" as ${design.uses.join(', ')}, not ${entry.role}.`);
  }
  return design;
}

/** Writes one module per group, rewriting only those that changed and removing stale ones. */
export function generateAssets(root = process.cwd()): { groups: string[] } {
  const selection = JSON.parse(readFileSync(join(root, SELECTION), 'utf8')) as SelectionEntry[];
  const catalogs = new Map<string, Map<string, CatalogDesign>>();
  const grouped = new Map<string, { entry: SelectionEntry; design: CatalogDesign }[]>();
  const seen = new Set<string>();
  for (const entry of selection) {
    if (!catalogs.has(entry.package)) catalogs.set(entry.package, readCatalog(root, entry.package));
    const design = checkEntry(entry, catalogs.get(entry.package)!.get(entry.design), seen);
    grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), { entry, design }]);
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
      // An edited selection regenerates the modules, and Vite reloads what imports them. A mistake is
      // reported and keeps the last good modules instead of stopping the server.
      const selection = resolve(root, SELECTION);
      server.watcher.add(selection);
      server.watcher.on('change', file => {
        if (resolve(file) !== selection) return;
        try {
          generateAssets(root);
        } catch (error) {
          server.config.logger.error(`[asset-manifest] ${error instanceof Error ? error.message : String(error)}`, { timestamp: true });
        }
      });
    },
  };
}
