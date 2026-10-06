import type { Plugin, Rolldown } from 'vite';

/*
 * Starts the first screen's artwork from the HTML. elder-scrolls requests the table and the main
 * paper only once the app's script has run, seconds after the fonts on a slow connection, and the
 * first screen waits for both. A script at the top of the head picks each one's copy for this screen
 * exactly as the package does (the smallest copy at least as dense as the screen, else the densest
 * copy, or the original for artwork without copies)
 * and preloads it at the default low priority, so a server that honours priorities still sends the
 * app's script first. Only up to 2x screens: above that the copies (460 KB for a rag sheet on walnut)
 * delayed the script, and so the first screen, by 0.8 s on a slow connection while finishing the
 * artwork only 0.1 s sooner, so those screens keep requesting it from the script. Leaving the choice to the browser (imagesrcset) would not do: browsers choose by
 * their own rules, and wherever theirs differs from the package's, the artwork would download twice.
 * test/artwork-preload.test.ts holds the two choices together.
 */

/** Each elder-scrolls artwork id the CSS declares (`rag`, and its copies `rag@1x`, `rag@2x`) → its URL. */
export function cssArtwork(css: string): Map<string, string> {
  const rules = css.matchAll(/\.es-asset-probe\[data-es-asset=("?)([\w\\@-]+)\1\]\s*\{[^}]*?background-image\s*:\s*url\(\s*(["']?)([^"')]+)\3\s*\)/g);
  return new Map([...rules].map(([, , id, , url]) => [id!.replace(/\\/g, ''), url!]));
}

/** The head script: one image preload per artwork id, of the copy this screen gets, up to 2x screens. */
export function preloadScript(ids: readonly string[], artwork: ReadonlyMap<string, string>): string {
  const sources = ids.map(id => {
    const original = artwork.get(id);
    if (!original) throw new Error(`The CSS declares no elder-scrolls artwork "${id}"; is the package's stylesheet still imported?`);
    const copies = [...artwork].flatMap(([key, url]) => {
      const density = key.startsWith(`${id}@`) && /^(\d+)x$/.exec(key.slice(id.length + 1))?.[1];
      return density ? [[Number(density), url] as const] : [];
    }).sort(([a], [b]) => a - b);
    return [copies, original];
  });
  return `(()=>{const r=window.devicePixelRatio||1;if(r>2)return;for(const[c,o]of ${JSON.stringify(sources)}){const m=c.find(([d])=>d>=r)||c[c.length-1],l=document.createElement('link');l.rel='preload';l.as='image';l.href=m?m[1]:o;document.head.append(l)}})()`;
}

const compiledCss = (bundle: Rolldown.OutputBundle) =>
  Object.values(bundle).flatMap(output => output.type === 'asset' && output.fileName.endsWith('.css') ? [String(output.source)] : []).join('\n');

export function artworkPreload(ids: readonly string[]): Plugin {
  return {
    name: 'polyhymnia-artwork-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        // Builds only: the dev server serves artwork locally, where a preload wins nothing.
        if (!bundle) return;
        // Right after the charset, which must open the document, and before the stylesheet link: a
        // script after it would wait for the stylesheet to load.
        const script = `<script>${preloadScript(ids, cssArtwork(compiledCss(bundle)))}</script>`;
        const charset = /<meta\s+charset=[^>]*>/i;
        if (!charset.test(html)) throw new Error('index.html has no <meta charset> to place the artwork preload after.');
        return html.replace(charset, tag => `${tag}\n    ${script}`);
      },
    },
  };
}
