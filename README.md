<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/banner-dark.png">
    <img alt="Polyhymnia — ear training for musicians: the difference between reading music and hearing it" src="docs/readme/banner-light.png" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/adrian729/polyhymnia-ear-training/actions/workflows/pages.yml"><img alt="Deploy status" src="https://github.com/adrian729/polyhymnia-ear-training/actions/workflows/pages.yml/badge.svg"></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-ea76cb">
</p>

<p align="center">
  <a href="https://adrian729.github.io/polyhymnia-ear-training/"><b>Open the app</b></a>
</p>

Polyhymnia trains the part of musicianship that reading notation alone does not: hearing what is written. Short exercises play real scores and ask you to name, place or correct what you heard — no abstract interval buttons, no MIDI. Notation, theory and sound come from the [`@polyhymnia/*` packages](https://github.com/adrian729/notation).

## Exercises

Exercises are grouped into Intervals, Chords and Rhythm:

| Group | Exercise | What it trains |
|---|---|---|
| Intervals | **Interval Comparison** | Hear two intervals and say which is wider, or whether they match. No note names, nothing to read. |
| Intervals | **Interval Identification** | Hear one interval and name it, from perfect 4ths and 5ths up to compound intervals. |
| Intervals | **Multi-Note Interval Identification** | Hear a stack of three to five notes and name every note's interval above the lowest. |
| Chords | **Chord Identification** | Hear one chord and name its quality, from major and minor up to seventh chords. |
| Rhythm | **Pulse Tapping** | Tap guided, unguided, compound or selected beats, then keep the pulse against displaced clicks. |
| Rhythm | **Rhythm Tap-back** | Hear a short rhythm and tap it back at the same tempo. |
| Rhythm | **Rhythm Recognition** | Match a heard rhythm to its written pattern. |
| Rhythm | **Metre Identification** | Identify the metre from accented beat groups. |
| Rhythm | **Rhythm Reading** | Read a short score and tap its rhythm. |
| Rhythm | **Rhythm Error Detection** | Compare related rhythms by ear or against a score. |
| Rhythm | **Silent-bar Timing** | Keep the pulse when the metronome falls silent. |

Each has lesson and custom modes, and the app is entirely client-side. Specs live in [`docs/exercises/`](docs/exercises/); product research in [`docs/`](docs/).

## Development

Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui and TanStack Router.

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

To develop against local checkouts of the packages, clone `notation`, `music-theory`, `web-audio` and `rhythm` next to this repo (or set `POLYHYMNIA_SRC` to their parent directory), build them and run `pnpm dev:link`. Linking changes only `node_modules`; `pnpm dev:unlink` restores the installed packages. Unlink before installing or committing.

Rhythm exercises use the published `@polyhymnia/rhythm`, `@polyhymnia/rhythm-react` and `@polyhymnia/web-audio` packages. See [pulse implementation notes](docs/exercises/r1-pulse-tapping-implementation.md) for package boundaries and checks.

## License

[MIT](LICENSE) © 2026 Adrián Sánchez Albanell. Bundled fonts, samples and ornaments keep their own licences — see the OFL and CREDITS files beside them.
