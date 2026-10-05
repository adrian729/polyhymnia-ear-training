import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import type { Plugin } from 'vite';

// index.html links the PNG from public/, which serves it unhashed in dev and build alike. It is
// rendered from the favicon art on every dev start and build and gitignored, never committed.
const SOURCE = 'src/assets/logo/polyhymnia-logo-favicon.svg';
const OUTPUT = 'public/polyhymnia-favicon.png';
const SIZE = 64;

export function favicon(): Plugin {
  let root = process.cwd();
  const render = async () => {
    const png = await sharp(resolve(root, SOURCE)).resize(SIZE, SIZE).png().toBuffer();
    const output = resolve(root, OUTPUT);
    if (!existsSync(output) || !readFileSync(output).equals(png)) writeFileSync(output, png);
  };
  return {
    name: 'favicon',
    configResolved(config) {
      root = config.root;
    },
    async buildStart() {
      await render();
    },
    configureServer(server) {
      server.watcher.on('change', file => {
        if (file === resolve(root, SOURCE)) render().catch(error => server.config.logger.error(`[favicon] ${error}`));
      });
    },
  };
}
