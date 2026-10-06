import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { preloadArtwork } from '@ranx729/elder-scrolls';
import { MAIN_PAPER, TABLE } from '@/lib/materials';
import { cssArtwork, preloadScript } from '../scripts/artwork-preload';

// The package's artwork registry, which the app's compiled CSS carries.
const ids = [...cssArtwork(readFileSync(new URL('./assets.css', import.meta.resolve('@ranx729/elder-scrolls/styles.css')), 'utf8')).keys()];

afterEach(() => vi.unstubAllGlobals());

// The HTML never preloads a copy elder-scrolls does not then load, which every visitor with that screen
// would download twice, and up to 2x screens it preloads all the first screen's artwork.
it.each([1, 1.25, 1.5, 2, 2.625, 3])('preloads the artwork elder-scrolls loads at %sx', async ratio => {
  const base = `https://screen-${ratio}.test/`;
  const loaded: string[] = [];
  const document = {
    baseURI: base,
    defaultView: { devicePixelRatio: ratio, Image: class { set src(url: string) { loaded.push(url); } decode() { return Promise.resolve(); } } },
    styleSheets: [{ href: null, cssRules: ids.map(id => ({ selectorText: `.es-asset-probe[data-es-asset="${id}"]`, style: { backgroundImage: `url("/${id}")` } })) }],
    createElement: () => ({ ownerDocument: document }),
  };
  vi.stubGlobal('document', document);
  await preloadArtwork({ papers: [MAIN_PAPER], surfaces: [TABLE] });

  const preloaded: string[] = [];
  const urls = new Map(ids.map(id => [id, new URL(`/${id}`, base).href]));
  new Function('window', 'document', preloadScript([MAIN_PAPER, TABLE], urls))(
    { devicePixelRatio: ratio },
    { createElement: () => ({}), head: { append: (link: { href: string }) => preloaded.push(link.href) } },
  );
  expect(loaded).toHaveLength(2);
  expect(preloaded.sort()).toEqual(ratio <= 2 ? loaded.sort() : []);
});
