const INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
