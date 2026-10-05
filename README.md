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

Exercises are grouped into Intervals, Chords, Rhythm and Pitch:

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
| Pitch | **Match a note** | Hear a reference, then sing and hold it in the same octave with live pitch feedback and accepted-hold measurements. |

All exercises have lesson and custom modes. **Rhythm settings** on the Rhythm page and timed lesson catalogs offer **Enable microphone claps**, alongside click/touch and Space. While enabled, the same section exposes minimum sound level, required sound rise, minimum clap gap and microphone timing adjustment; explanations are in one helper popup. These settings are saved and shared across timed rhythm exercises. Microphone access always needs explicit activation, starts off after a reload, and is released when disabled, hidden, rhythm practice finishes or you leave the exercise group. Use headphones; sharp sounds other than claps may register. Clap sessions show timing results but do not update saved lesson progress while physical microphone delay is being evaluated.

**Pitch settings** on the Pitch page, Match a note lesson catalog and custom setup provide the same blue enabled button and conditional microphone controls. Set minimum sound level and pitch clarity while enabled. Vocal range remains available with the microphone off: choose Bass, Baritone, Tenor, Alto, Mezzo-soprano, Soprano or Custom, then edit either note limit. Presets apply both bounds; later edits retain your selected kind and are saved. Starting ranges follow [Yale Library’s vocal-range guide](https://yalelibrary.atlassian.net/wiki/spaces/YMD/pages/202030334), and are conventions rather than a classification of your voice. Note limits support every semitone from C2 to F6, including a single-note range.

Match a note uses the standard lesson catalog, progress and summary components. Lesson entries stay disabled until the microphone is ready. Pitch settings show “Microphone required to start” with the enable button directly beneath it; custom Start follows the same prerequisite. Direct lesson URLs show Pitch settings before practice. References play automatically on each question, with a flat/sharp guide and continuous-hold bar. After a match, the guide shows the accepted minimum-to-maximum range and an average-pitch marker; a table shows the same measurements in Hz and cents. Only the required successful hold contributes, with overlapping samples counted once; measurements remain in the session summary. If input stops, a setup screen keeps completed answers and requires explicit resume; summaries and replay remain available with the microphone off. Each lesson asks five notes inside your saved range, with ±50 cents and a half-second or one-second continuous hold. Four correct matches pass (80%); Skip counts as wrong. There is no answer time limit, and replay before a match resets the hold. Completed lesson results persist; interrupted questions and custom sessions do not update lesson progress. Custom sessions support question counts, endless practice, automatic continuation, tolerance and hold duration. Pitch activation carries between settings, lessons and summaries within Pitch until disabled, hidden or the group is left; capture analysis pauses at the summary.

The app is entirely client-side. Microphone input is analyzed locally, without recording or uploads. Specs live in [`docs/exercises/`](docs/exercises/); product research and the [audio integration plan](docs/audio-input-implementation-plan.md) live in [`docs/`](docs/).

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

[MIT](LICENSE) © 2026 Adrián Sánchez Albanell. Bundled fonts, samples and ornaments keep their own licences — see the OFL and CREDITS files beside them. The pitch worker preserves Pitchy and fft.js MIT notices; a copy ships in [public/licenses/pitchy-fft.txt](public/licenses/pitchy-fft.txt).
