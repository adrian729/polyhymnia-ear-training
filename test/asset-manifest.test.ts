import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateAssets } from '../scripts/asset-manifest.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'src/generated/assets');

describe('asset manifest', () => {
  it('resolves every selection entry and writes a module per group', () => {
    const { groups } = generateAssets(ROOT);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) expect(() => readFileSync(join(OUT, `${group}.ts`))).not.toThrow();
  });

  it('sizes every generated import at build time, like the app requires', () => {
    const unsized = readdirSync(OUT).filter(file => file.endsWith('.ts')).flatMap(file =>
      [...readFileSync(join(OUT, file), 'utf8').matchAll(/from\s+'([^']+)'/g)]
        .map(match => match[1]!)
        .filter(specifier => /\.(webp|avif|png|jpe?g|svg)(\?|$)/.test(specifier))
        .filter(specifier => !/[?&][wh]=[^&]+.*&format=/.test(specifier))
        .map(specifier => `${file}: ${specifier}`));
    expect(unsized).toEqual([]);
  });

  it('draws a frame at the slice its catalog declares, so a change cannot cut motifs', () => {
    const generated = readFileSync(join(OUT, 'frames.ts'), 'utf8');
    const selection = JSON.parse(readFileSync(join(ROOT, 'scripts/ornament-selection.json'), 'utf8')) as { design: string; package: string; role: string }[];
    for (const entry of selection.filter(item => item.role === 'frame')) {
      const catalog = JSON.parse(readFileSync(join(ROOT, 'node_modules', entry.package, 'catalog.json'), 'utf8'));
      const designs: { name: string; border_image_slice_percent?: number }[] = Array.isArray(catalog) ? catalog : Object.values(catalog.designs);
      const design = designs.find(item => item.name === entry.design)!;
      expect(design.border_image_slice_percent).toBeTypeOf('number');
      expect(generated).toContain(String(design.border_image_slice_percent));
    }
  });
});
