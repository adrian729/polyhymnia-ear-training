// The shape of every generated asset entry (scripts/asset-manifest.ts) and what the components
// consume. Generated group modules are typed by the ambient declaration in src/generated-assets.d.ts,
// so this file is the single source for both.
//
// Four roles, because the art is genuinely two kinds (tinted line art vs painted colour) and two
// placements (a whole image vs a repeating/bordered frame):
//   mask    – alpha silhouette drawn in currentColor, generated as a ladder of raster heights.
//   image   – a finished picture, drawn through <img> with a srcset.
//   frame   – a border-image atlas with a slice, drawn at each density.
//   divider – a repeating tile, sized for each direction and density.

export interface ImageVariant {
  src: string;
  width: number;
  height: number;
}

export interface MaskAsset {
  kind: 'mask';
  /** Smallest-first; the top rung is the master, so a mask is never upscaled. */
  ladder: readonly ImageVariant[];
}

export interface ImageAsset {
  kind: 'image';
  src: string;
  srcSet: string;
  /** Intrinsic size of the source art, so the layout reserves the right box before it loads. */
  width: number;
  height: number;
  /** Optional display windows and opaque rule junctions, in master-image pixels. */
  titleFlourishes?: TitleFlourishes;
}

interface TitleFlourish {
  bounds: readonly [left: number, top: number, right: number, bottom: number];
  join: readonly [x: number, y: number];
  safeHalfHeight: number;
}

export interface TitleFlourishes {
  opening: TitleFlourish & { text: readonly [left: number, capMidline: number] };
  closing: TitleFlourish;
}

/** One drawn size at 1x, 2x and 3x. A copy is capped at the master, so the densest screens may get
 *  the same file as the one below them rather than an upscale. */
export interface DensityCopies {
  '1x': string;
  '2x': string;
  '3x': string;
}

/** The narrow thickness, and optionally the wider one drawn from the `sm` breakpoint up. */
type Thicknesses<T> = readonly [T] | readonly [T, T];

export interface FrameAsset {
  kind: 'frame';
  /** The atlas slice as a percentage, from the design's catalog metadata. */
  slicePercent: number | readonly [number, number];
  /** For each drawn border width in CSS pixels. */
  copies: Thicknesses<{ thickness: number; images: DensityCopies }>;
}

export interface DividerAsset {
  kind: 'divider';
  /** For each drawn strip thickness in CSS pixels, the tile repeating along each direction. */
  copies: Thicknesses<{ thickness: number; horizontal: DensityCopies; vertical: DensityCopies }>;
}

export type Asset = MaskAsset | ImageAsset | FrameAsset | DividerAsset;

/** One generated module per group; names are the keys pages use. */
export type AssetGroup = Readonly<Record<string, Asset>>;

export type AssetRole = Asset['kind'];

/** Narrows a generated group entry to a role, so a page fails loudly on a selection mistake
 *  instead of rendering the wrong thing. */
function pick<T extends Asset>(group: AssetGroup, name: string, kind: AssetRole): T {
  const asset = group[name];
  if (!asset) throw new Error(`No generated asset "${name}"; add it to scripts/ornament-selection.json.`);
  if (asset.kind !== kind) throw new Error(`Generated asset "${name}" is a ${asset.kind}, not a ${kind}.`);
  return asset as T;
}

export const maskAsset = (group: AssetGroup, name: string) => pick<MaskAsset>(group, name, 'mask');
export const imageAsset = (group: AssetGroup, name: string) => pick<ImageAsset>(group, name, 'image');
export const frameAsset = (group: AssetGroup, name: string) => pick<FrameAsset>(group, name, 'frame');
export const dividerAsset = (group: AssetGroup, name: string) => pick<DividerAsset>(group, name, 'divider');

/**
 * A copy set as a CSS image, for art only CSS can draw (a border or background image).
 * -webkit-image-set() is image-set()'s legacy alias, which browsers must accept. Unprefixed
 * image-set() needs Chrome 113 or Safari 17, and an inline style gets no fallback from the CSS build.
 */
export const imageSet = (copies: DensityCopies) =>
  `-webkit-image-set(url("${copies['1x']}") 1x, url("${copies['2x']}") 2x, url("${copies['3x']}") 3x)`;
