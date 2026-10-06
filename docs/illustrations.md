# Illustrations: medieval / renaissance, free

> Sourcing has moved: illustrations now live in `@ranx729/medieval-ornaments` (github.com/adrian729/medieval-ornaments) and the app imports them directly from its resource packages. Add new artwork there, not under `src/assets`; the research below is kept for reference.

Research date 2026-09-30. Nothing downloaded. "Free" = usable in this public repo and in a possibly commercial app. Each source below says what you get, how to find it, and which pipeline (A–D) turns it into a project asset.

## Quick start

| I want… | Go to | Pipeline |
| --- | --- | --- |
| Dividers, fleurons, corner pieces (tintable) | [British Library Flickr: Decorations & Designs](https://www.flickr.com/photos/britishlibrary/albums/72157638797895895/), [publicdomainvectors](https://publicdomainvectors.org/en/free-decorative-vector-ornaments) | B (BL scans), A (vectors) |
| Decorated initials (tintable, woodcut look) | Wikimedia Commons: Ratdolt / incunabula initials, Kelmscott Chaucer | B |
| Illuminated initials, borders, marginalia (colour) | [Digital Walters](https://thedigitalwalters.org/01_ACCESS_WALTERS_MANUSCRIPTS.html), [Getty](https://search.getty.edu/gateway/landing) | C |
| Musicians and instruments (colour) | [Commons: Codex of the musicians](https://commons.wikimedia.org/wiki/Category:Codex_of_the_musicians) (Cantigas) | C |
| Small object icons (lute, quill, scroll) | [game-icons.net](https://game-icons.net) | A |
| Printers' flowers as text | IM Fell Flowers font | D |

## Pipelines: getting an asset into the project

All assets go under `apps/app/src/assets/illustrations/<kind>/` (e.g. `ornaments/`, `initials/`, `figures/`), with one `CREDITS.txt` in `illustrations/` listing file → source URL → licence (same idea as `public/samples/piano/CREDITS.txt`). Name files by what they are (`divider-vine.svg`, `initial-a-ratdolt.svg`), not by source id.

Tools: `cwebp` and Python Pillow are installed; `potrace`, `svgo` and ImageMagick are not (`brew install potrace imagemagick`, `pnpm dlx svgo`).

### A. Ready-made SVG

1. Download the SVG.
2. Clean: `pnpm dlx svgo --multipass in.svg -o out.svg`; remove hard-coded `fill`/`stroke` colours (or set them to `currentColor`).
3. Commit under `illustrations/<kind>/`, add a `CREDITS.txt` line.
4. Use in CSS as a mask so it takes a token colour: `mask: url(...) center / contain no-repeat; background-color: var(--color-muted-foreground)`; or import with `?raw` and inline it.

### B. Line-art scan → tintable SVG (woodcuts, printers' ornaments, one-colour initials)

1. Download the largest available image (≥ 1500 px on the long side if possible).
2. Crop tightly to one ornament (any image editor, or Pillow `Image.crop`).
3. Convert to pure black/white: greyscale + threshold (Pillow `convert('L').point(lambda p: 255 if p > 140 else 0)`; tune the threshold so parchment disappears and thin lines survive). Save as `.pbm` / `.bmp`.
4. Trace: `potrace in.pbm -s -o out.svg` (`-t 5` drops specks, `-a 1` smooths corners).
5. Continue with pipeline A steps 2–4.

### C. Colour image (illuminations, miniatures)

1. Download the largest image (Walters 1800 px JPEG is enough for web).
2. Crop to the detail you want; knock out the background only if placing on the paper texture (otherwise keep the parchment as a framed picture).
3. Resize to ~2× the displayed size, then `cwebp -q 80 in.png -o out.webp`.
4. Commit under `illustrations/<kind>/`, add a `CREDITS.txt` line; import in React (`import url from '...webp'`) with `loading="lazy"`; in dark mode frame it or lower opacity.

### D. Ornament font

1. Download the font; check its bundled licence file.
2. Subset to the glyphs used and convert to WOFF2 (`pyftsubset` from fonttools, same tooling as `packages/notation-fonts`).
3. Add an `@font-face` + token in `apps/app/src/styles/theme.css`; render the glyphs as text (they then follow `color` and dark mode automatically).

## Sources

### British Library "Mechanical Curator" (Flickr Commons)

- **What**: ~1M images cut from 17th–19th-century books; album [Decorations & Designs](https://www.flickr.com/photos/britishlibrary/albums/72157638797895895/) (1,706 images: head/tail pieces, fleurons, frames) and [Illustrated Letters & Typography](https://www.flickr.com/photos/britishlibrary/albums/72157638733975756/) (decorated initials).
- **Licence**: public domain mark; no credit required.
- **Find**: open an album and scroll, or search Flickr within the `britishlibrary` account for "headpiece", "tailpiece", "ornament", "initial".
- **Download**: photo page → download arrow (bottom right) → "Original".
- **Pipeline**: B. Mostly black-ink engravings, traces cleanly. Style is post-1600 (baroque/Georgian), not medieval.

### Wikimedia Commons: incunabula initials, Kelmscott Chaucer

- **What**: 15th-century woodcut initials and borders (Erhard Ratdolt and other early printers); William Morris's Kelmscott Chaucer (1896) borders and initials, medieval revival with very clean lines.
- **Licence**: public domain (tagged PD-Art / PD-old); check the "Licensing" box on each file page.
- **Find**: search Commons for "Ratdolt initial", "woodcut initial", "Kelmscott Chaucer"; open the category links at the bottom of a good file to find siblings.
- **Download**: file page → "Download" (top) → largest size, or "Original file" link under the image.
- **Pipeline**: B.

### Digital Walters (Walters Art Museum)

- **What**: ~900 illuminated manuscripts, every page photographed: borders, illuminated initials, line fillers, marginal grotesques and musicians.
- **Licence**: CC0; no credit required.
- **Find**: [manuscript list](https://thedigitalwalters.org/01_ACCESS_WALTERS_MANUSCRIPTS.html) by shelfmark (W.1, W.2…); the list shows title, date and origin, so pick books of hours and psalters (richest decoration), 14th–15th century. Not searchable by motif; browse the thumbnails.
- **Download**: manuscript folder (`Data/WaltersManuscripts/html/W<n>/`) → JPEG set (1800 px long side) is enough; master TIFFs (600–1200 ppi) for tracing small details.
- **Pipeline**: C (colour), or B for pen-work borders.

### Getty Open Content

- **What**: illuminated manuscripts (Flemish, French, Italian) and 16th–18th-century prints; ~88k images.
- **Licence**: CC0; credit line "Digital image courtesy of Getty's Open Content Program" requested, not required. Don't imply Getty endorsement.
- **Find**: [search.getty.edu gateway](https://search.getty.edu/gateway/landing) → "Open Content Images" → "Only records with images"; search "manuscript", "initial", "border", "musician". Manuscript records include every digitised folio.
- **Download**: object page → "Download" button (full resolution JPEG); IIIF also available (`media.getty.edu/iiif/...`).
- **Pipeline**: C.

### The Met Open Access

- **What**: manuscript leaves, ornament prints (renaissance/baroque designs for borders and friezes), Dürer and other woodcuts, instrument engravings.
- **Licence**: CC0.
- **Find**: [collection search](https://www.metmuseum.org/art/collection/search) with the "Open Access" filter on; search "ornament print", "initial", "manuscript leaf", "musician"; department "Drawings and Prints" or "Medieval Art".
- **Download**: object page → download icon (bottom right of the image). Bulk: [API / CSV](https://www.metmuseum.org/hubs/open-access).
- **Pipeline**: B for prints, C for leaves.

### Rijksmuseum

- **What**: renaissance/baroque ornament engravings, printers' ornaments, music-making prints.
- **Licence**: CC0 for public-domain works.
- **Find**: collection search on rijksmuseum.nl, type "print", search "ornament" / "grotesque" / "initial".
- **Download**: object page → download (full resolution).
- **Pipeline**: B.

### Wikimedia Commons: Cantigas de Santa Maria, Codex of the musicians

- **What**: 13th-century miniatures of paired musicians (lutes, ouds, rebabs, bagpipes, psalteries); the best thematic fit for a music app.
- **Licence**: public domain (source: Real Biblioteca del Monasterio de El Escorial); check each file's tag.
- **Find**: [category](https://commons.wikimedia.org/wiki/Category:Codex_of_the_musicians) (70 files); resolution varies from ~300 px to ~2150 px, so prefer the larger ones (e.g. "Christian and Muslim playing ouds…", 2149 × 2047).
- **Download**: file page → "Download" → original.
- **Pipeline**: C.

### Codex Manesse (Heidelberg)

- **What**: 137 full-page portraits of Minnesänger, c.1300–1340, several with instruments.
- **Licence**: CC BY-SA 4.0 (check the volume's start page). Credit format: `Universitätsbibliothek Heidelberg / Cod. Pal. germ. 848 / <page>`. Derived images (crops, traces) must stay CC BY-SA; app code is unaffected.
- **Find**: [digital edition](https://digi.ub.uni-heidelberg.de/en/bpd/glanzlichter/codex_manesse.html) → page thumbnails.
- **Download**: page view → download option (JPEG) or IIIF; exact menu not verified.
- **Pipeline**: C.

### publicdomainvectors.org / Openclipart

- **What**: ornament SVGs (dividers, frames, flourishes); mixed quality and style, some are traces of old ornaments.
- **Licence**: public domain / CC0.
- **Find**: [decorative ornaments](https://publicdomainvectors.org/en/free-decorative-vector-ornaments); search "ornament", "divider", "vintage frame".
- **Download**: SVG download button on each item.
- **Pipeline**: A. Check each file for bloated paths before using.

### game-icons.net

- **What**: ~4000 single-colour SVG icons, including lute, harp, quill, scroll, banner; icon style, not period art.
- **Licence**: CC BY 3.0; credit per icon author ("Icons made by {author}. Available on https://game-icons.net").
- **Find**: search on the site, or the [GitHub repo](https://github.com/game-icons/icons) (all SVGs by author folder).
- **Download**: icon page → SVG (colour editable in the site's studio), or copy from the repo.
- **Pipeline**: A.

### IM Fell Flowers 1 / 2

- **What**: two fonts of 17th-century printers' flowers (Fell types, digitised by Igino Marini); repeat glyphs for dividers and borders.
- **Licence**: reported as OFL on font sites, but older Marini releases carried a custom licence (credit required, no modification). Download from [Font Squirrel](https://www.fontsquirrel.com/fonts/im-fell-flowers-1) and check the bundled licence before subsetting.
- **Pipeline**: D.

### rawpixel

- **What**: cleaned-up cutouts of public-domain art, including illuminated borders.
- **Licence**: only items marked "CC0" / "Public Domain" are free; the rest are rawpixel's own licence.
- **Find**: [search](https://www.rawpixel.com/search/medieval%20border) with the public-domain filter; free account needed for high-res.
- **Pipeline**: C, or A if an SVG is offered.

### Public Domain Image Archive

- **What**: curated, cleaned public-domain images by The Public Domain Review; good for browsing ideas, links back to the holding institution.
- **Licence**: public domain.
- **Find**: [pdimagearchive.org](https://pdimagearchive.org/).
- **Pipeline**: B or C depending on the image.

## Not usable (or only under conditions)

- **Vectorian ornaments** ([svgornaments](https://github.com/cionx/svgornaments), [pgfornament](https://ctan.org/pkg/pgfornament), [vectorian.net](https://www.vectorian.net/free-vintage-vectors.html)): the Vectorian licence forbids redistributing them "in any format that will allow a third party to access to the images in digital vector format", SVG included. Committing SVGs to a public repo or serving them to browsers breaks that. Only usable rasterised (PNG/WebP). The pgfornament LaTeX package itself is LPPL 1.3. The [catalogue PDF](https://mirrors.ctan.org/macros/latex/contrib/tkz/pgfornament/doc/ornaments.pdf) is still useful for ideas.
- **Bodleian Digital, e-codices**: CC BY-NC, non-commercial only.
- **Gallica (BnF)**: free for non-commercial use; commercial reuse needs a paid BnF licence.
- **Morgan Library**: no open licence; permission per image.

## Licence notes

- **CC0 / public domain**: no credit required; still list the source in `CREDITS.txt` so the origin is traceable.
- **CC BY** (game-icons): credit required.
- **CC BY-SA** (Heidelberg): credit required; derived images stay CC BY-SA.
- **Wikimedia Commons**: licence is per file; photos of 2D public-domain art are usually PD-Art, but some uploads carry a photographer's licence.
- Never imply endorsement by the source institution.
