const INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Downloads the files a font family declares (its @font-face rules in the loaded stylesheets) at low
 * priority, without loading the face: `document.fonts` never reports a load in progress, which would
 * hold a newly opened page's text (SheetLayout), and the face loads from the cache once text uses it.
 * It fetches every file of the family, so a family split by range wants `document.fonts.load` with
 * its text instead (preloadInitials).
 */
export function prefetchFontFiles(family: string): Promise<unknown> {
  const urls: string[] = [];
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule) || rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim() !== family) continue;
      for (const [, url] of rule.style.getPropertyValue('src').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        urls.push(new URL(url!, sheet.href ?? document.baseURI).href);
      }
    }
  }
  // Reading the body makes sure the whole file reaches the cache, not just its headers.
  return Promise.all(urls.map(url => fetch(url, { priority: 'low' }).then(response => response.arrayBuffer())));
}

/**
 * The illuminated initials are split one file per letter (scripts/font-faces.ts), so a first page
 * fetches only its own. Loading the rest afterwards means a later title never waits for its letter.
 * Families come from the theme tokens, not repeated here.
 */
export function preloadInitials(): void {
  const root = getComputedStyle(document.documentElement);
  for (const token of ['--font-initial-frame', '--font-initial-letter']) {
    const family = root.getPropertyValue(token).trim();
    if (family) void document.fonts.load(`1em ${family}`, INITIALS).catch(() => {});
  }
}
