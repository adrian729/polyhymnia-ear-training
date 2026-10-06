import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const IMAGE = /\.(avif|gif|jpe?g|png|svg|webp)(\?[^'")]*)?$/;

function sources(extensions: string[], dir = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'generated' ? [] : sources(extensions, path);
    return extensions.includes(extname(entry.name)) ? [path] : [];
  });
}

const name = (path: string) => relative(SRC, path);

describe('images', () => {
  it('render only through ResponsiveImage', () => {
    const raw = sources(['.tsx']).filter(file => !file.endsWith('ResponsiveImage.tsx') && /<img[\s>]/.test(readFileSync(file, 'utf8')));
    expect(raw.map(name)).toEqual([]);
  });

  it('are imported with build-time sizing, never as the source file', () => {
    const unsized = sources(['.ts', '.tsx']).flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)]
        .map(match => match[1]!)
        .filter(specifier => IMAGE.test(specifier) && !/[?&][wh]=[^&]+.*&format=/.test(specifier))
        .map(specifier => `${name(file)}: ${specifier}`));
    expect(unsized).toEqual([]);
  });

  it('rasterize vector art losslessly', () => {
    const lossy = sources(['.ts', '.tsx']).flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+\.svg\?[^'"]*)['"]/g)]
        .map(match => match[1]!)
        .filter(specifier => /[?&]format=/.test(specifier) && !/[?&]lossless(?:=true)?(?:&|$)/.test(specifier))
        .map(specifier => `${name(file)}: ${specifier}`));
    expect(lossy).toEqual([]);
  });

  it('are never referenced from CSS, which cannot size them', () => {
    const referenced = sources(['.css']).flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
        .map(match => match[1]!)
        .filter(url => IMAGE.test(url))
        .map(url => `${name(file)}: ${url}`));
    expect(referenced).toEqual([]);
  });
});
