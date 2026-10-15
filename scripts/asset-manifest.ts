import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';

/*
 * Turns a hand-curated selection (scripts/ornament-selection.json) into per-group asset modules
 * under the gitignored src/generated/assets. For each named design it reads the installed package's
 * catalog.json for the facts the app must not hardcode — intrinsic size, transparency, the frame
 * slice, the divider repeat — and emits vite-imagetools imports sized the way the app draws them:
 * lossy WebP for images and masks, AVIF for fine-coloured frames, and never an upscale.
 *
 * This is the one place an ornament is added. Components read the generated group; nothing else
 * names a package. Run at dev/build/test start (vite.config.ts, vitest.config.ts), like the fonts.
 */

const OUT_DIR = 'src/generated/assets';
const SELECTION = 'scripts/ornament-selection.json';
const GENERATOR = 'scripts/asset-manifest.ts';

interface SelectionEntry {
  group: string;
  name: string;
  package: string;
  design: string;
  role: 'mask' | 'image' | 'frame' | 'divider';
  /** image: the widths the srcset offers. */
  widths?: number[];
  /** image/frame/mask: lossy encode quality. */
  quality?: number;
  /** frame: each drawn border width in CSS pixels, narrowest first. */
  thicknessesPx?: number[];
}

interface CatalogVariant {
  max_dimension: number;
  width: number;
  height: number;
  webp?: string;
  png?: string;
}

interface CatalogDesign {
  name: string;
  width: number;
  height: number;
  webp?: string;
  png?: string;
  has_transparency?: boolean;
  variants?: CatalogVariant[];
  border_image_slice_percent?: number;
  repeat_ratio?: number;
  repeat_axis?: 'x' | 'y' | 'none';
  components?: {
    border_image?: { webp?: string; width: number; height?: number; slice_pixels?: number };
    rotated_tile?: { webp?: string };
  };
}

function readCatalog(root: string, pkg: string): Map<string, CatalogDesign> {
  const file = join(root, 'node_modules', pkg, 'catalog.json');
  if (!existsSync(file)) throw new Error(`asset-manifest: ${pkg}/catalog.json is missing; is the package installed?`);
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as CatalogDesign[] | { designs: Record<string, CatalogDesign> };
  const list = Array.isArray(parsed) ? parsed : Object.values(parsed.designs);
  return new Map(list.map(design => [design.name, design]));
}

const specifier = (pkg: string, path: string, query: string) => `${pkg}/${path}?${query}`;

/** The ladder rungs a mask is generated at: fixed steps up to the master, never above it. */
function maskRungs(height: number): number[] {
  return [...[32, 64, 128, 256, 512, 768].filter(step => step < height), height];
}

function emitMask(entry: SelectionEntry, design: CatalogDesign, pkg: string, q: number, slot: string): { imports: string; body: string } {
  if (!design.webp) throw new Error(`asset-manifest: mask design "${design.name}" has no webp master.`);
  const rungs = maskRungs(design.height);
  const query = `h=${rungs.join(';')}&quality=${q}&format=webp&as=metadata:src;width;height`;
  return {
    imports: `import ${slot}data from '${specifier(pkg, design.webp, query)}';`,
    body: `ladder: [...${slot}data].sort((a, b) => a.height - b.height)`,
  };
}

function emitImage(entry: SelectionEntry, design: CatalogDesign, pkg: string, q: number, slot: string): { imports: string; body: string } {
  if (!design.webp) throw new Error(`asset-manifest: image design "${design.name}" has no webp master.`);
  const widths = [...new Set(entry.widths ?? [])].sort((a, b) => a - b);
  if (widths.length < 2) throw new Error(`asset-manifest: image "${entry.name}" needs at least two widths.`);
  const base = widths.at(-1)!;
  return {
    imports: [
      `import ${slot}src from '${specifier(pkg, design.webp, `w=${base}&quality=${q}&format=webp`)}';`,
      `import ${slot}srcSet from '${specifier(pkg, design.webp, `w=${widths.join(';')}&quality=${q}&format=webp&as=srcset`)}';`,
    ].join('\n'),
    body: `src: ${slot}src, srcSet: ${slot}srcSet, width: ${design.width}, height: ${design.height}, transparent: ${design.has_transparency === true}`,
  };
}

function emitFrame(entry: SelectionEntry, design: CatalogDesign, pkg: string, q: number, slot: string): { imports: string; body: string } {
  const border = design.components?.border_image;
  const slicePercent = design.border_image_slice_percent;
  if (!border?.webp || slicePercent === undefined) throw new Error(`asset-manifest: frame design "${design.name}" has no border_image atlas.`);
  const slicePx = border.slice_pixels ?? design.width;
  const thicknesses = entry.thicknessesPx ?? [];
  if (thicknesses.length === 0) throw new Error(`asset-manifest: frame "${entry.name}" needs thicknessesPx.`);
  const imports: string[] = [];
  const copies: string[] = [];
  thicknesses.forEach((thickness, index) => {
    // The atlas is drawn at `thickness` px, so a slice of slicePx maps to that width; scale by the
    // master-to-slice ratio, then round each density on its own.
    const width = (thickness * border.width) / slicePx;
    const urls = [1, 2, 3].map(density => {
      const name = `${slot}frame${index}_${density}`;
      imports.push(`import ${name} from '${specifier(pkg, border.webp!, `w=${Math.round(width * density)}&quality=${q}&format=avif`)}';`);
      return `'${density}x': ${name}`;
    });
    copies.push(`{ thickness: ${thickness}, ${urls.join(', ')} }`);
  });
  return { imports: imports.join('\n'), body: `slicePercent: ${slicePercent}, copies: [${copies.join(', ')}]` };
}

function emitDivider(entry: SelectionEntry, design: CatalogDesign, pkg: string, q: number, slot: string): { imports: string; body: string } {
  const rotated = design.components?.rotated_tile?.webp;
  if (!design.webp || !rotated || design.repeat_ratio === undefined) throw new Error(`asset-manifest: divider design "${design.name}" has no repeat tile.`);
  return {
    imports: [
      `import ${slot}tile from '${specifier(pkg, design.webp, `quality=${q}&format=webp`)}';`,
      `import ${slot}rotated from '${specifier(pkg, rotated, `quality=${q}&format=webp`)}';`,
    ].join('\n'),
    body: `tile: ${slot}tile, rotated: ${slot}rotated, ratio: ${design.repeat_ratio}, axis: '${design.repeat_axis === 'y' ? 'y' : 'x'}'`,
  };
}

const EMIT: Record<SelectionEntry['role'], (entry: SelectionEntry, design: CatalogDesign, pkg: string, q: number, slot: string) => { imports: string; body: string }> = {
  mask: emitMask,
  image: emitImage,
  frame: emitFrame,
  divider: emitDivider,
};

const DEFAULT_QUALITY = { mask: 82, image: 82, frame: 60, divider: 82 } as const;

function renderGroup(group: string, entries: { entry: SelectionEntry; design: CatalogDesign }[]): string {
  const imports: string[] = [];
  const bodies: string[] = [];
  let slot = 0;
  for (const { entry, design } of entries) {
    const quality = entry.quality ?? DEFAULT_QUALITY[entry.role];
    // One prefix per entry, so a group with many designs never collides on an import name.
    const { imports: groupImports, body } = EMIT[entry.role](entry, design, entry.package, quality, `a${slot++}`);
    if (groupImports) imports.push(groupImports);
    bodies.push(`  '${entry.name}': { kind: '${entry.role}', ${body} },`);
  }
  return [
    `// Generated by ${GENERATOR} from ${SELECTION}. Do not edit; rebuilt on dev and build.`,
    `import type { AssetGroup } from '@/lib/assets';`,
    ...imports,
    '',
    'const group: AssetGroup = {',
    ...bodies,
    '};',
    '',
    'export default group;',
    '',
  ].join('\n');
}

function readSelection(root: string): SelectionEntry[] {
  return JSON.parse(readFileSync(join(root, SELECTION), 'utf8')) as SelectionEntry[];
}

/** Writes one module per group and returns the bytes of the key that decides whether to rewrite. */
export function generateAssets(root = process.cwd()): { key: string; groups: string[] } {
  const selection = readSelection(root);
  const catalogs = new Map<string, Map<string, CatalogDesign>>();
  const grouped = new Map<string, { entry: SelectionEntry; design: CatalogDesign }[]>();
  const inputs: string[] = [readFileSync(join(root, GENERATOR), 'utf8'), JSON.stringify(selection)];

  for (const entry of selection) {
    let catalog = catalogs.get(entry.package);
    if (!catalog) {
      catalog = readCatalog(root, entry.package);
      catalogs.set(entry.package, catalog);
      inputs.push(JSON.stringify([...catalog.values()]));
    }
    const design = catalog.get(entry.design);
    if (!design) throw new Error(`asset-manifest: "${entry.design}" is not in ${entry.package}.`);
    const role = entry.role;
    if (role === 'mask' || role === 'image' || role === 'divider') {
      if (!design.webp) throw new Error(`asset-manifest: "${entry.design}" has no webp master for role ${role}.`);
    }
    grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), { entry, design }]);
  }

  const key = createHash('sha256').update(inputs.join('\n')).digest('hex');
  const out = resolve(root, OUT_DIR);
  if (existsSync(join(out, '.key')) && readFileSync(join(out, '.key'), 'utf8') === key) {
    return { key, groups: [...grouped.keys()] };
  }
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const [group, entries] of grouped) writeFileSync(join(out, `${group}.ts`), renderGroup(group, entries));
  writeFileSync(join(out, '.key'), key);
  return { key, groups: [...grouped.keys()] };
}

/** Generates the asset modules at config load, so they exist before any import is resolved. */
export function assetManifest(): Plugin {
  return {
    name: 'asset-manifest',
    configResolved(config) {
      generateAssets(config.root);
    },
  };
}
