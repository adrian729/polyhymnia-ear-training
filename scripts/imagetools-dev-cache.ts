import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/*
 * vite-imagetools' dev server encodes an image again on every request: its middleware pipes a sharp
 * pipeline instead of the bytes it already made, and when that pipeline starts from its disk cache it
 * re-encodes at sharp's defaults, so dev showed a lower quality than the build. WebP takes milliseconds,
 * but an AVIF copy (PaintedFrame's) took 0.3–2 s, on every page load. imagetools writes each image's
 * encoded bytes, the ones a build emits, to its cache under the id it serves them by; this serves that
 * file. imagetools() runs `pre`, so this does too, and must come before it in the plugin list.
 */
export function imagetoolsDevCache(cacheDir = 'node_modules/.cache/imagetools'): Plugin {
  return {
    name: 'polyhymnia-imagetools-dev-cache',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      const prefix = `${server.config.base.replace(/\/$/, '')}/@imagetools/`;
      const root = join(server.config.root, cacheDir);
      server.middlewares.use((req, res, next) => {
        const id = req.url?.startsWith(prefix) ? req.url.slice(prefix.length) : undefined;
        const file = id && /^\w+$/.test(id) ? join(root, id) : undefined;
        if (!file || !existsSync(file)) return next();
        const bytes = readFileSync(file);
        res.setHeader('Content-Type', imageType(bytes) ?? 'application/octet-stream');
        res.end(bytes);
      });
    },
  };
}

// The cache keeps bare bytes; their signature names the format.
function imageType(bytes: Buffer): string | undefined {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString('latin1');
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'image/avif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (/^\s*<(\?xml|svg)/.test(ascii(0, 64))) return 'image/svg+xml';
  return undefined;
}
