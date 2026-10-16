# Opening and closing acanthus flourishes

Four variations on the selected marginal-bouquet direction. Each has an opening curl around the first letter, a smaller ending ornament, and divider segments that meet opaque gold caps outside the text. There is no underline.

Open `/output/acanthus-bouquet-variations/index.html` on the project's Vite dev server. Current review URL: http://127.0.0.1:5175/output/acanthus-bouquet-variations/index.html.

The comparison retains the previous preview's editable second heading, four typefaces, three type sizes, and narrow-sheet setting. **C — Ivy tendril was selected and integrated into `AcanthusTitle`, used on the exercise category pages and home index.** The four-way comparison remains here for reference.

The selected centre artwork is declared in the local ornament package and delivered through the generated responsive AVIF pipeline. The surrounding divider retains the original painted outer ends, their sizes, and the original red-and-gold line thickness. The simplified lines in the four-way study are not used in the app. The catalog owns its display windows and gold-cap junctions. On narrow sheets, large type receives a little extra clearance from the curl.

- `selected-in-app.png`: the integrated heading on the Intervals page.
- `selected-mobile.png`: the integrated heading on a 390px Chords page.
- `check-restored-divider.js`: verifies the title divider against the existing divider on the same page, including original end images, dimensions, line styling, alignment, and opaque centre joins.
- `selected-verification.json`: passing production checks at 1440, 390, and 320px, plus typecheck, build, and test results.

| Variation | Opening | Ending |
| --- | --- | --- |
| A — Compact curl | Rounded blue leaf, red lower return | Small red-and-gold foliate curl |
| B — Rising scroll | Upright red-and-blue sweep | Petite blue leaf |
| C — Ivy tendril | Open composition with ivy and fine gold curls | Light ivy-and-acanthus sprig |
| D — Folded fan | Diagonal blue-and-red fan | Low horizontal leaf |

## Layout

The lettering stays live. Ornaments retain their aspect ratios and follow the font size, with their size capped on narrow sheets to preserve room for whole words. The first letter sits inside the opening curl's transparent pocket. Lines end inside the opaque painted junctions; they never run behind or below the words. Closing flourishes follow the final letter.

Wrapped headings use a small hanging indent so later lines clear the opening leaf tips. The two taller endings become more compact when text wraps, keeping their upper leaves clear of the previous line. This preview measures the first and last graphemes and the current font's cap height rather than assuming a fixed word width or baseline.

## Review files

- `comparison.png`: normal-size, side-by-side comparison.
- `mobile.png`: wrapped sentence at phone width.
- `narrow-large.png`: narrow specimens with 32px type.
- `junction-details.png`: three-times-density capture of all four normal-size designs.
- `check-preview.js`: checks overflow, split words, rule positions, opacity at the junctions, and foliage against glyph bounds through the preview's public controls.
- `check-details.js`: creates the enlarged review capture.
- `verification.json`: five passing scenarios across 1440, 768, 390 and 320px, all four typefaces, and narrow 32px headings. All 80 checked junctions remain inside opaque paint (minimum sampled alpha 252/255); no split words, text collisions or page overflow were found in these scenarios.

## Artwork

Generated using the built-in `image_gen` tool. The exact prompts and installed medieval-ornaments style references are saved in `prompts.json`. `assets.json` records the generated masters, final asset paths, native dimensions, and layout geometry. The four files in `assets/` are lossless WebP conversions; original pixels, dimensions and transparency are preserved. The separate opening and closing ornaments are displayed through CSS windows onto each original pair, without stretching the painting.
