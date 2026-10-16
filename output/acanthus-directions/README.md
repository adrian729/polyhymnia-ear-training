# Acanthus heading directions

Four comparison studies, with live text rather than painted lettering. Open `/output/acanthus-directions/index.html` on the project's Vite dev server. The current review server is http://127.0.0.1:5175/output/acanthus-directions/index.html.

The preview shows each design with “Exercises” and an editable second heading. It offers Texturina, Junicode, EB Garamond and a system sans serif, three type sizes, and a narrow-sheet setting. The text input also offers sample phrases.

| Direction | Composition | Response to longer or taller text |
| --- | --- | --- |
| A — Low garland | A continuous acanthus bough underneath the heading, connected to the horizontal rule at its gold terminals. | The lettering wraps above it; the whole bough keeps its aspect ratio. |
| B — Folded scroll | A parchment banderole with acanthus hanging from its lower folds. | Plain parchment extends; the complete leaf clusters stay in fixed lower corners. The plain vertical band repeats to avoid streaking its texture. |
| C — Marginal bouquet | A single foliate cluster at the start of a rule beneath the words. | The heading grows upward above the rule; the bouquet remains intact at its lower left. |
| D — Illuminated panel | A thin gold enclosure with diagonally opposed acanthus corners. | Straight rules extend in both axes while the painted corners retain their dimensions. |

These are design studies for choosing a direction. Their files are contained here; this preview does not register any of these alternatives in the production ornament catalog.

## Review captures

- `comparison.png`: all four directions at the normal heading size.
- `narrow-large.png`: 280px specimens, 32px Texturina, and a wrapped sentence.
- `mobile.png`: phone-width comparison with a longer sentence.

`check-preview.js` checks page overflow and heading containment through the visible preview controls. Reviewed at 1440, 768, 390 and 320px, with all four typefaces represented. The captures were also inspected visually, including the rule junctions and the fixed foliage on the wrapped scroll.

## Artwork and provenance

Generated with the built-in `image_gen` tool. `prompts.json` contains the four initial prompts and style references; `scroll-revision.json` contains the correction that moved the scroll's foliage out of its extensible vertical band. `assets.json` maps the final assets to their generated masters. The files in `assets/` are lossless WebP conversions with original dimensions and alpha preserved.

The two painting references are the installed medieval-ornaments acanthus headpiece and divider terminal. Artwork stays in the same blue, vermilion, gold and olive manuscript palette. The preview imports the app's current typography and theme.
