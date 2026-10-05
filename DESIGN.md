# Polyhymnia — design system

Binding contract for every UI change in `apps/app`. Read before writing or editing any component, page, layout or style. If a request conflicts with this document, name the conflict before writing code rather than improvising.

## Design latitude

This document fixes the **system**. It does not fix the **composition**. Two things must be decided by a person or an agent with taste, and delegating them is the point:

- **Structure** — how the home page is built: a list or a grid, the grid geometry, where mass sits, how a promoted entry differs from the rest, the order things appear in, the density.
- **Ornament** — whether the manuscript idiom is carried by hairline rules, corner brackets, marginalia, rotated labels, a colophon, a folio number, or nothing. Which steps of the type scale go where. How the grain is used: strength, whether it sits over cards as well as the page, whether anything masks it.

These are not constrained by this document, and an implementer who asks for permission to make them has misunderstood it. Everything below — fonts, scales, colour roles, radius, shadows, motion, forbidden patterns — **is** binding.

## Archetype

**Atelier / conservatory manuscript.** Printed matter that someone set by hand: warm paper, iron-gall ink, hairline rules, generous margins, no gloss. It should feel like a well-made edition of a graded exercise book — not like SaaS.

The failure mode this document exists to prevent: a centered logo, a row of identical cards, purple-to-blue gradients, `rounded-2xl` on everything, and a drop shadow under each surface. That is the statistical average of the training data, and it reads as machine-made.

## Typography

Four families, four roles, no overlap. Display and data come from `@fontsource-variable`; Junicode and the initials are vendored WOFF2 in `apps/app/src/assets/fonts/` because neither is published on fontsource. No Google Fonts CDN.

| Role | Family | Token | Used for |
| --- | --- | --- | --- |
| Display | Texturina Variable | `--font-display` | Wordmark, `h1`–`h3`, exercise titles. Variable `wght` + `opsz`; optical sizing is automatic, so no per-element axis settings. |
| Text | Junicode VF | `--font-sans` | All prose, body copy, UI labels, buttons, inputs, list rows. Variable `wght` + `wdth`. Per-letter alternates are applied via `--font-body-features`. |
| Specimen | EB Garamond Variable | `--font-specimen` | Letter-spaced small caps: running heads, rubrics, folios. |
| Data | JetBrains Mono Variable | `--font-mono` | Anything numeric that must align or be compared: interval names and semitone counts, cents, Hz, tempo, timers, counts, version stamps. Tabular figures on. |

`--font-heading` resolves to `--font-display`.

**Body alternates.** `--font-body-features` is a hand-picked `cv##` variant per letter (the Junicode character-variant alternates), applied on `html` so prose is engraved rather than modern. It is deliberately *not* a blanket `font-feature-settings` on the page: the display, specimen and mono utilities reset to `normal`, because those families have no such features and would only be mangled by them. Adding a feature setting to a non-Junicode element is a bug.

**Illuminated initial.** Page titles (`h1` only) open with an illuminated capital: two stacked layers of the EB Garamond Initials font, `--font-initial-frame` (the ornament) behind `--font-initial-letter` (the letter), coloured by `--initial-frame` / `--initial-letter`. It is a *raised* initial, not a drop cap: it sits on the heading baseline and never intrudes into the text block below.

**Type scale** — six steps, no others. Sizes outside this list are a violation.

| Token | Size | Line height | Tracking | Role |
| --- | --- | --- | --- | --- |
| `--text-display` | 3.75rem | 1.05 | −0.02em | Wordmark only |
| `--text-title` | 2.25rem | 1.15 | −0.015em | `h1` |
| `--text-heading` | 1.5rem | 1.3 | −0.01em | `h2`, exercise titles |
| `--text-subhead` | 1.3125rem | 1.4 | 0 | `h3`, card titles |
| `--text-body` | 1.1875rem | 1.6 | 0 | Prose, list rows |
| `--text-meta` | 1rem | 1.4 | 0.02em | Labels, captions, small print — uppercase only for section labels |

Weights: 400 and 600 for text; 400/600/700 for display. No 500, no 800, no 900.

**Measure.** Prose columns are `max-width: 64ch`. Never center body copy longer than two lines. Left-align prose; reserve centering for the wordmark block alone.

## Color

**Lineage:** Catppuccin Latte, warmed. Catppuccin Latte neutrals sit at hue 264 (cool, faintly blue). Shift the neutral family to hue ~70 (warm paper) and keep chroma low. The result should read as cream laid paper, never as tinted grey.

**Accents have separate semantic roles. Blue also identifies an enabled microphone, as requested in the microphone UI review.**

| Role | Token | Value | Exclusive use |
| --- | --- | --- | --- |
| **Action pink** | `--primary` / `--primary-strong` | Catppuccin Latte pink, kept | Primary action fills, links, focus rings, active nav. Nothing else. |
| **Notation oxblood** | `--pn-selected` / `--pn-playing` / `--pn-cursor` | Dark warm red | The sounding, selected or playing pitch on a staff. UI chrome only. |
| **Microphone enabled** | `--rubric` / `--rubric-foreground` / `--rubric-strong` | Existing blue | The microphone toggle itself is filled blue while enabled. Clicking it disables input; no separate bordered status tag. |
| Semantic | `--success` / `--destructive` | green / red, warmed to match | Answer correctness. Never decoration. |

The split is deliberate and domain-justified: a playing note must not look like a button, and a button must not look like a note. They never appear in the same role, and each is used in exactly one.

**`--primary` is a fill.** Text, links, rings and notation highlights use `--primary-strong`. This existing rule is retained.

**Notation engraving** (`--pn-ink`, `--pn-staff`, `--pn-focus`, `--pn-selected`, `--pn-playing`, `--pn-cursor`, `--pn-label-ink`) must hold **≥ 4.5:1** against `--background` in both themes. Staff lines are decorative but note heads and labels are not; verify, do not assume. These tokens override values in `packages/notation-react/styles/notation.css`, which supply their own fallbacks — retuning the values here is safe and does not require touching that package.

## Shape and depth

- **One radius: 4px.** Exposed as `--radius`. One larger radius, 10px, is reserved for the two promoted exercise tiles on the home page and nothing else.
- **No drop shadows anywhere.** No `shadow-*`, no `box-shadow`, no `drop-shadow`. Paper does not float. Depth is expressed with 1px hairlines tinted toward the ink colour (`--border`), and with surface tint steps.
- Surface hierarchy comes from tint, not elevation: `--background` → `--surface-raised` → `--surface-sunken`, each a small step in warmth.
- Borders are hairlines at 1px, and at 2px only for a selected or focused state.

## Texture

Use the published `@ranx729/elder-scrolls` React components and geometry stylesheet for a dark walnut worktable and independent paper sheets. Use only the four light materials: aged parchment (`original`) for the home page, ivory vellum (`ivory`) for lesson catalogs, players, results, presets and error screens, cool vellum (`sage`) for custom forms, and warm linen rag (`rag`) for the separate contents sidebar. Main sheets have a rolled top and a plain-paper bottom; compact sidebars have paper edges at both ends. Contact shadows are disabled.

The package owns paper/table artwork; the app retains its fonts, ornaments, colors and controls. Keep the texture's physical scale. The wooden background stays fixed to the viewport. Lesson catalogs have separate scroll areas around the complete main and sidebar papers, so each sheet's edges, texture and contents move together while the other sheet stays in place. Keep the initial top and bottom gaps inside these scroll areas so the papers can reach their visible boundaries while scrolling. The paper content itself has no internal scroller. On narrow screens retain the collapsible contents list in a compact upper scroll area and the main paper below. Other pages use native document scrolling over the same fixed wood. Allow decorative edges into small-screen margins to preserve usable text width; never scale the whole sheet. Do not add a global grain or vignette over the packaged textures. Decoration must not intercept pointer events.

## Motion

Named tokens only:

```
--motion-fast: 120ms   hover, focus, press
--motion-base: 200ms   state change, disclosure
--motion-slow: 320ms   page entry
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)
```

Use transform and opacity for UI transitions. No bounce, no spring, no scale-pop, no fade-up-on-scroll, no `transition-all` — always name the properties. Motion is slow and few, matching paper: it settles, it does not perform.

Contents anchors use native smooth scrolling for the main paper, with instant navigation when reduced motion is requested.

## Layout

- **Home page is an index, not a card grid.** A left-weighted wordmark block, then the exercises as a titled list separated by hairline rules — a table of contents. Exercise entries are `max-width: 64ch`, left-aligned, each with title (display face), one line of description, and its entry affordance.
- **The recommended first exercise is visually distinct** — marked in the rule, not merely described in copy. The current home page says Interval Comparison is recommended while rendering it identically to the other three.
- No 3-equal-column card grids. Where a grid is genuinely needed, use asymmetric 60/40 or 70/30 splits.
- Vertical rhythm comes from `--space-*` tokens. No ad hoc `py-24` / `gap-12`.

## Spacing scale

Four steps, multiples of 4. Nothing else.

| Token | Value | Use |
| --- | --- | --- |
| `--space-tight` | 0.5rem | Within a group, label to value |
| `--space-base` | 1rem | Between related blocks |
| `--space-loose` | 2rem | Between groups |
| `--space-section` | 4rem | Between page sections |

## Copy

- Skeptical, precise, technical. This is an instrument, and it respects the person holding it.
- No `empower`, `leverage`, `seamless`, `robust`, `harness`, `delve`, `revolutionize`, or "in today's fast-paced".
- No fabricated testimonials, logos, metrics, customer counts, or streak claims. This is a single-developer tool; inventing social proof is the fastest way to make it feel cheap.
- Button labels are specific. "Start training" repeated four times is not a label, it is a default.

## Forbidden

Mechanical. A change touching any of these is not done.

- Any raw palette class in app code: no `text-teal-800`, no `bg-neutral-100`, no `text-pink-600`. Semantic tokens and `--pn-*` only. *(This rule already exists in `AGENTS.md`; the home page currently violates it.)*
- Inter or Geist anywhere. No new font families beyond the three above.
- Any drop shadow, any `shadow-*` utility.
- `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or any radius outside the two named above.
- `transition-all`.
- A 3-equal-card grid, a centered logo hero with a floating screenshot, a gradient mesh or blob behind text, emoji used as icons, or a "Trusted by" logo row.
- Any type size not in the scale table. Any spacing value not in the spacing table.
- Additional accent hues beyond the defined roles. The enabled microphone reuses the existing blue rubric palette.

## Definition of done

1. `pnpm typecheck` passes.
2. `pnpm test` passes.
3. Every changed file uses semantic tokens only — grep the diff for `text-(teal|pink|blue|neutral|red|green|peach|yellow|lavender|mauve|white|black)-`, `bg-` equivalents, `#`, and `rgb(`.
4. Every interactive element has hover, focus-visible, active and disabled states.
5. Focus rings are visible and meet WCAG 2.2 AA.
6. The four light paper surfaces reviewed at 390px, 768px and 1440px; dark papers are outside the current visual scope.
7. All `--pn-*` tokens verified ≥ 4.5:1 against the light paper surfaces they appear on.

## Scope boundary

This document governs appearance only. Interaction, hit-testing, audio, playback and quiz logic are correct as they stand and must not change. Component props, exported names, event handlers and data flow are fixed. Where this document and a functional requirement appear to conflict, the functional requirement wins and this document should be amended — not the other way round.
