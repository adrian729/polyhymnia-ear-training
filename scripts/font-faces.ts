import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import subsetFont from 'subset-font';
import type { Plugin, Rolldown } from 'vite';

/*
 * Vendored faces are never served whole. At build start (dev and build) each source is split:
 * `ranges` into Unicode-range files, so a page downloads only the scripts it shows, and
 * `characters` into one file per character, so a page downloads only the initials it shows.
 * Every character of every source is kept. The OpenType features and variation axes the files
 * keep are derived from what the app's CSS requests, so nothing here lists content or features.
 */
interface FaceSpec {
  family: string;
  source: string;
  style: 'normal' | 'italic';
  split: 'ranges' | 'characters';
}

const FACES: readonly FaceSpec[] = [
  { family: 'Junicode VF', source: 'src/assets/fonts/junicode-roman.woff2', style: 'normal', split: 'ranges' },
  { family: 'Junicode VF', source: 'src/assets/fonts/junicode-italic.woff2', style: 'italic', split: 'ranges' },
  { family: 'EB Garamond Initials Frame', source: 'src/assets/fonts/eb-garamond-initials-f1.woff2', style: 'normal', split: 'characters' },
  { family: 'EB Garamond Initials Letter', source: 'src/assets/fonts/eb-garamond-initials-f2.woff2', style: 'normal', split: 'characters' },
];

const OUT_DIR = 'src/generated/fonts';
// Body text and titles are on every page, so the HTML requests their Basic Latin files alongside the
// scripts instead of the app requesting them once it has rendered text. Files are found by family.
const PRELOAD_TOKENS = ['--font-sans', '--font-display'];
// Part of the cache key: changing this script regenerates the fonts. Vite bundles the config, so
// the script is read by path rather than through import.meta.
const GENERATOR = 'scripts/font-faces.ts';

// Google Fonts' ranges, as fontsource ships them. Later groups win where ranges overlap,
// so the shared combining marks resolve to latin.
const SCRIPT_RANGES: readonly (readonly [string, string])[] = [
  ['cyrillic-ext', 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'],
  ['cyrillic', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'],
  ['greek-ext', 'U+1F00-1FFF'],
  ['greek', 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF'],
  ['vietnamese', 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'],
  ['latin-ext', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ['latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
];

// What a source holds outside those ranges: the symbol area by Unicode block, so one stray
// symbol fetches a small file, then private use. Anything else lands in one last file.
const SYMBOL_BLOCKS = [
  0x2070, 0x20a0, 0x20d0, 0x2100, 0x2150, 0x2190, 0x2200, 0x2300, 0x2400, 0x2440, 0x2460, 0x2500,
  0x2580, 0x25a0, 0x2600, 0x2700, 0x27c0, 0x27f0, 0x2800, 0x2900, 0x2980, 0x2a00, 0x2b00, 0x2c00,
];
const REMAINDER_RANGES: readonly (readonly [string, string])[] = [
  ...SYMBOL_BLOCKS.slice(0, -1).map((start, i) => {
    const hex = (n: number) => n.toString(16).toUpperCase();
    return [`symbols-${hex(start).toLowerCase()}`, `U+${hex(start)}-${hex(SYMBOL_BLOCKS[i + 1]! - 1)}`] as const;
  }),
  ['private-use', 'U+E000-F8FF'],
];

// HarfBuzz's default shaping features: what browsers apply with no CSS at all.
const DEFAULT_FEATURES = [
  'rvrn', 'ccmp', 'liga', 'locl', 'mark', 'mkmk', 'rlig', 'frac', 'numr', 'dnom', 'calt', 'clig', 'curs', 'kern', 'rclt',
  'valt', 'vert', 'vkna', 'vkrn', 'vpal', 'vrt2', 'ltra', 'ltrm', 'rtla', 'rtlm', 'rand', 'jalt', 'chws', 'vchw', 'halt', 'vhal',
  'init', 'medi', 'fina', 'isol', 'med2', 'fin2', 'fin3', 'cswh', 'mset', 'stch', 'ljmo', 'vjmo', 'tjmo', 'abvs', 'blws', 'abvm',
  'blwm', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref', 'blwf', 'half', 'abvf', 'pstf', 'cfar', 'vatu', 'cjct', 'pres', 'psts', 'haln', 'dist',
];

// CSS font-variant keywords and the OpenType features they switch on.
const VARIANT_FEATURES: Readonly<Record<string, readonly string[]>> = {
  'small-caps': ['smcp'], 'all-small-caps': ['smcp', 'c2sc'], 'petite-caps': ['pcap'], 'all-petite-caps': ['pcap', 'c2pc'],
  unicase: ['unic'], 'titling-caps': ['titl'], 'lining-nums': ['lnum'], 'oldstyle-nums': ['onum'], 'proportional-nums': ['pnum'],
  'tabular-nums': ['tnum'], 'diagonal-fractions': ['frac'], 'stacked-fractions': ['afrc'], ordinal: ['ordn'], 'slashed-zero': ['zero'],
  'common-ligatures': ['liga', 'clig'], 'discretionary-ligatures': ['dlig'], 'historical-ligatures': ['hlig'], contextual: ['calt'],
  'historical-forms': ['hist'], sub: ['subs'], super: ['sups'], ruby: ['ruby'],
};

// Tailwind's font-variant-numeric utilities, recognised as class names in markup.
const UTILITY_VARIANTS = ['ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions'];

// Axes the browser drives from font-weight, font-optical-sizing and font-style; any other axis is
// fixed at its default unless the CSS asks for it.
const BROWSER_AXES = new Set(['wght', 'opsz', 'ital', 'slnt']);

interface Requests {
  features: Set<string>;
  axes: Set<string>;
}

/** Features and axes requested by CSS text or by class names in markup. */
function requestsIn(texts: readonly string[]): Requests {
  const bodies = texts.map(text => text.replace(/@font-face\s*\{[^}]*\}/g, ''));
  const custom = new Map<string, string[]>();
  for (const body of bodies) {
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) custom.set(name!, [...(custom.get(name!) ?? []), value!]);
  }
  const expand = (value: string, depth = 0): string => depth > 8 ? value
    : value.replace(/var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g, (_, name: string, fallback?: string) =>
      expand([...(custom.get(name) ?? []), fallback ?? ''].join(' '), depth + 1));
  const features = new Set<string>();
  const axes = new Set<string>();
  const tags = (value: string) => [...expand(value).matchAll(/["']([\x20-\x7e]{4})["']/g)].map(match => match[1]!);
  for (const body of bodies) {
    for (const [, value] of body.matchAll(/font-feature-settings\s*:\s*([^;{}\]]+)/g)) tags(value!).forEach(tag => features.add(tag));
    for (const [, value] of body.matchAll(/font-variation-settings\s*:\s*([^;{}\]]+)/g)) tags(value!).forEach(tag => axes.add(tag));
    for (const [, value] of body.matchAll(/font-variant(?:-[a-z]+)?\s*:\s*([^;{}\]]+)/g)) {
      for (const word of expand(value!).match(/[a-z-]+/g) ?? []) VARIANT_FEATURES[word]?.forEach(tag => features.add(tag));
    }
    for (const word of UTILITY_VARIANTS) {
      if (new RegExp(`(?<![\\w-])${word}(?![\\w-])`).test(body)) VARIANT_FEATURES[word]!.forEach(tag => features.add(tag));
    }
    if (/font-stretch\s*:|(?<![\w-])font-stretch-[\w%-]+/.test(body)) axes.add('wdth');
  }
  return { features, axes };
}

/** The app's own sources, plus the stylesheets they import from packages. */
function scannedTexts(root: string): string[] {
  const files = new Set<string>();
  const generated = resolve(root, OUT_DIR, '..');
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (path !== generated) walk(path); }
      else if (['.css', '.ts', '.tsx'].includes(extname(entry.name))) files.add(path);
    }
  };
  walk(resolve(root, 'src'));
  files.add(resolve(root, 'index.html'));
  const require = createRequire(resolve(root, 'package.json'));
  const stylesheets = [...files];
  const texts: string[] = [];
  const seen = new Set<string>();
  while (stylesheets.length) {
    const file = stylesheets.pop()!;
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    texts.push(text);
    const imports = [...text.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g), ...text.matchAll(/import\s+["']([^"']+\.css)["']/g)];
    for (const [, specifier] of imports) {
      try {
        const target = specifier!.startsWith('.') ? resolve(dirname(file), specifier!) : require.resolve(specifier!);
        if (target.endsWith('.css') && !target.startsWith(generated + sep)) stylesheets.push(target);
      } catch { /* JS entry points and unresolvable imports carry no font requests. */ }
    }
  }
  return texts;
}

function parseRanges(ranges: string): [number, number][] {
  return ranges.split(',').map(range => {
    const [start, end = start] = range.trim().replace(/^U\+/i, '').split('-');
    // Minifiers write whole blocks as wildcards: U+?? is U+0000-00FF.
    return [parseInt(start!.replaceAll('?', '0'), 16), parseInt(end!.replaceAll('?', 'F'), 16)];
  });
}

function formatRanges(codepoints: readonly number[]): string {
  const sorted = [...codepoints].sort((a, b) => a - b);
  const parts: string[] = [];
  const hex = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    parts.push(i === j ? `U+${hex(sorted[i]!)}` : `U+${hex(sorted[i]!)}-${hex(sorted[j]!)}`);
    i = j + 1;
  }
  return parts.join(', ');
}

interface Axis { tag: string; min: number; default: number; max: number }

/** Mapped codepoints and variation axes of an SFNT font. */
function readFont(font: Buffer): { codepoints: number[]; axes: Axis[] } {
  const tables = new Map<string, number>();
  for (let i = 0, count = font.readUInt16BE(4); i < count; i++) {
    const record = 12 + i * 16;
    tables.set(font.toString('latin1', record, record + 4), font.readUInt32BE(record + 8));
  }
  const axes: Axis[] = [];
  const fvar = tables.get('fvar');
  if (fvar !== undefined) {
    const fixed = (at: number) => font.readInt32BE(at) / 65536;
    const first = fvar + font.readUInt16BE(fvar + 4);
    for (let i = 0, count = font.readUInt16BE(fvar + 8), size = font.readUInt16BE(fvar + 10); i < count; i++) {
      const axis = first + i * size;
      axes.push({ tag: font.toString('latin1', axis, axis + 4), min: fixed(axis + 4), default: fixed(axis + 8), max: fixed(axis + 12) });
    }
  }
  const cmap = tables.get('cmap');
  if (cmap === undefined) throw new Error('Font has no cmap table.');
  const subtables = Array.from({ length: font.readUInt16BE(cmap + 2) }, (_, i) => {
    const record = cmap + 4 + i * 8;
    const at = cmap + font.readUInt32BE(record + 4);
    return { platform: font.readUInt16BE(record), encoding: font.readUInt16BE(record + 2), at, format: font.readUInt16BE(at) };
  });
  const unicode = subtables.filter(table => table.platform === 0 || (table.platform === 3 && [1, 10].includes(table.encoding)));
  const best = unicode.find(table => table.format === 12) ?? unicode.find(table => table.format === 4);
  if (!best) throw new Error('Font has no Unicode cmap subtable.');
  const codepoints: number[] = [];
  if (best.format === 12) {
    for (let i = 0, groups = font.readUInt32BE(best.at + 12); i < groups; i++) {
      const group = best.at + 16 + i * 12;
      const start = font.readUInt32BE(group), end = font.readUInt32BE(group + 4), glyph = font.readUInt32BE(group + 8);
      for (let code = start; code <= end; code++) if (glyph + code - start !== 0) codepoints.push(code);
    }
  } else {
    const segments = font.readUInt16BE(best.at + 6) / 2;
    const ends = best.at + 14, starts = ends + segments * 2 + 2, deltas = starts + segments * 2, offsets = deltas + segments * 2;
    for (let i = 0; i < segments; i++) {
      const start = font.readUInt16BE(starts + i * 2), end = font.readUInt16BE(ends + i * 2);
      const delta = font.readInt16BE(deltas + i * 2), offset = font.readUInt16BE(offsets + i * 2);
      for (let code = start; code <= end && code !== 0xffff; code++) {
        let glyph = offset === 0 ? code : font.readUInt16BE(offsets + i * 2 + offset + (code - start) * 2);
        if (offset !== 0 && glyph === 0) continue;
        glyph = (glyph + delta) & 0xffff;
        if (glyph !== 0) codepoints.push(code);
      }
    }
  }
  return { codepoints, axes };
}

/** Script-range groups (overlaps kept), then the remainder by Unicode area, then whatever is left. */
function rangeGroups(codepoints: readonly number[]): [string, number[]][] {
  const inRanges = (ranges: [number, number][]) => (code: number) => ranges.some(([start, end]) => code >= start && code <= end);
  const scripts = SCRIPT_RANGES.map(([name, ranges]) => [name, codepoints.filter(inRanges(parseRanges(ranges)))] as [string, number[]]);
  let rest = codepoints.filter(code => !scripts.some(([, members]) => members.includes(code)));
  const remainder: [string, number[]][] = [];
  for (const [name, ranges] of REMAINDER_RANGES) {
    const members = rest.filter(inRanges(parseRanges(ranges)));
    remainder.push([name, members]);
    rest = rest.filter(code => !members.includes(code));
  }
  // Rules declared later are matched first, so the script ranges come last.
  return [['other', rest], ...remainder.reverse(), ...scripts].filter(([, members]) => members.length > 0) as [string, number[]][];
}

const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

const compiledCss = (bundle: Rolldown.OutputBundle) =>
  Object.values(bundle).flatMap(output => output.type === 'asset' && output.fileName.endsWith('.css') ? [String(output.source)] : []);

const familyName = (value: string) => value.split(',')[0]!.trim().replace(/^["']|["']$/g, '');

/**
 * The file serving lowercase Basic Latin for the family each preload token names first. Tokens are
 * read from the sources (the theme inlines them, so compiled CSS may not declare them) and faces
 * from the compiled CSS, so this follows the theme and every face, vendored or from fontsource.
 * Declarations naming a family nothing serves (Tailwind's defaults) are ignored.
 */
function preloadedFonts(sources: readonly string[], css: string): string[] {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => body!);
  const basicLatin = (family: string) => faces.find(body =>
    familyName(body.match(/font-family\s*:\s*([^;]+)/)?.[1] ?? '') === family
    && !/font-style\s*:\s*italic/.test(body)
    && parseRanges(body.match(/unicode-range\s*:\s*([^;]+)/)?.[1] ?? 'U+0-10FFFF').some(([start, end]) => start <= 0x61 && 0x61 <= end),
  )?.match(/src\s*:\s*url\(\s*["']?([^"')]+)/)?.[1];
  return PRELOAD_TOKENS.map(token => {
    const declared = sources.flatMap(text => [...text.matchAll(new RegExp(`(?<![\\w-])${token}\\s*:\\s*([^;{}]+)`, 'g'))].map(([, value]) => familyName(value!)));
    const files = [...new Set(declared.flatMap(family => basicLatin(family) ?? []))];
    if (files.length !== 1) {
      throw new Error(`Expected one served family for ${token} to preload, found ${files.length} (declared: ${[...new Set(declared)].join(', ') || 'none'}).`);
    }
    return files[0]!;
  });
}

async function generate(root: string, requests: Requests, key: string, log: (message: string) => void): Promise<void> {
  const started = performance.now();
  const out = resolve(root, OUT_DIR);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const keepFeatures = [...new Set([...DEFAULT_FEATURES, ...requests.features])].sort();
  const rules: string[] = [];
  let files = 0;
  for (const face of FACES) {
    const source = readFileSync(resolve(root, face.source));
    const sfnt = await subsetFont(source, undefined, { targetFormat: 'sfnt', keepAllGlyphs: true });
    const { codepoints, axes } = readFont(sfnt);
    const variationAxes = Object.fromEntries(axes.filter(axis => !BROWSER_AXES.has(axis.tag) && !requests.axes.has(axis.tag)).map(axis => [axis.tag, axis.default]));
    const kept = axes.filter(axis => !(axis.tag in variationAxes));
    const weight = kept.find(axis => axis.tag === 'wght');
    const stretch = kept.find(axis => axis.tag === 'wdth');
    const slug = basename(face.source, extname(face.source));
    const groups = face.split === 'ranges' ? rangeGroups(codepoints)
      : codepoints.map(code => [code.toString(16).padStart(4, '0'), [code]] as [string, number[]]);
    for (const [group, members] of groups) {
      const file = `${slug}-${group}.woff2`;
      const options = { targetFormat: 'woff2' as const, keepFeatures, ...(axes.length ? { variationAxes } : {}) };
      writeFileSync(join(out, file), await subsetFont(sfnt, String.fromCodePoint(...members), options));
      files++;
      rules.push([
        '@font-face {',
        `  font-family: '${face.family}';`,
        `  font-style: ${face.style};`,
        `  font-weight: ${weight ? `${weight.min} ${weight.max}` : 'normal'};`,
        ...(stretch ? [`  font-stretch: ${stretch.min}% ${stretch.max}%;`] : []),
        '  font-display: swap;',
        `  src: url('./${file}') format('${kept.length ? 'woff2-variations' : 'woff2'}');`,
        `  unicode-range: ${formatRanges(members)};`,
        '}',
      ].join('\n'));
    }
  }
  const header = `/* Generated by scripts/font-faces.ts from src/assets/fonts. Do not edit; it is rebuilt on dev and build. */\n/* Kept features: ${keepFeatures.join(' ')} */\n\n`;
  writeFileSync(join(out, 'fonts.css'), header + rules.join('\n\n') + '\n');
  writeFileSync(join(out, '.key'), key);
  log(`generated ${files} font files in ${((performance.now() - started) / 1000).toFixed(1)} s`);
}

/** Splits the vendored fonts at build start and checks the compiled CSS asks for nothing they lack. */
export function fontFaces(): Plugin {
  let root = process.cwd();
  let log: (message: string) => void = () => {};
  let requested: Requests = { features: new Set(), axes: new Set() };
  let sources: string[] = [];
  let running: Promise<void> | undefined;
  let rerun = false;

  const inputsKey = (requests: Requests) => {
    const require = createRequire(resolve(root, 'package.json'));
    const subsetVersion = JSON.parse(readFileSync(join(dirname(require.resolve('subset-font')), 'package.json'), 'utf8')).version;
    return sha(JSON.stringify({
      generator: sha(readFileSync(resolve(root, GENERATOR))),
      subsetVersion,
      faces: FACES.map(face => ({ ...face, source: sha(readFileSync(resolve(root, face.source))) })),
      features: [...requests.features].sort(),
      axes: [...requests.axes].sort(),
    }));
  };

  const ensure = async () => {
    sources = scannedTexts(root);
    requested = requestsIn(sources);
    const key = inputsKey(requested);
    const out = resolve(root, OUT_DIR);
    if (existsSync(join(out, 'fonts.css')) && existsSync(join(out, '.key')) && readFileSync(join(out, '.key'), 'utf8') === key) return;
    await generate(root, requested, key, log);
  };

  const schedule = () => {
    if (running) { rerun = true; return; }
    running = ensure().catch(error => log(`failed: ${error instanceof Error ? error.message : String(error)}`)).finally(() => {
      running = undefined;
      if (rerun) { rerun = false; schedule(); }
    });
  };

  return {
    name: 'font-faces',
    config(config) {
      // Most split files are under Vite's inline limit. Inlined, every one of them would ship
      // inside the stylesheet of every page; served as files, a page fetches only what it shows.
      const generated = resolve(config.root ?? process.cwd(), OUT_DIR) + sep;
      const limit = config.build?.assetsInlineLimit;
      return {
        build: {
          assetsInlineLimit: (file: string, content: Buffer) => file.startsWith(generated) ? false
            : typeof limit === 'function' ? limit(file, content) : limit === undefined ? undefined : content.length < limit,
        },
      };
    },
    configResolved(config) {
      root = config.root;
      log = message => config.logger.info(`[font-faces] ${message}`, { timestamp: true });
    },
    async buildStart() {
      await ensure();
    },
    configureServer(server) {
      const generated = resolve(root, OUT_DIR, '..') + sep;
      const changed = (file: string) => {
        if (file.startsWith(generated) || relative(root, file).startsWith('..')) return;
        if (['.css', '.ts', '.tsx', '.html'].includes(extname(file))) schedule();
      };
      server.watcher.on('change', changed).on('add', changed).on('unlink', changed);
    },
    transformIndexHtml: {
      order: 'post',
      handler(_, { bundle }) {
        // Builds only: the dev server serves fonts locally, where a preload wins nothing.
        if (!bundle) return;
        return preloadedFonts(sources, compiledCss(bundle).join('\n')).map(href => ({
          tag: 'link',
          attrs: { rel: 'preload', href, as: 'font', type: 'font/woff2', crossorigin: true },
          injectTo: 'head' as const,
        }));
      },
    },
    generateBundle(_, bundle) {
      const compiled = requestsIn(compiledCss(bundle));
      const kept = new Set([...DEFAULT_FEATURES, ...requested.features]);
      const features = [...compiled.features].filter(tag => !kept.has(tag));
      const axes = [...compiled.axes].filter(tag => !BROWSER_AXES.has(tag) && !requested.axes.has(tag));
      if (features.length || axes.length) {
        this.error(`The compiled CSS requests ${[...features, ...axes].join(', ')}, which the split fonts do not keep. Teach requestsIn() in scripts/font-faces.ts to find that request in the sources.`);
      }
    },
  };
}
