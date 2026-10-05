# Pulse tapping implementation

Implemented locally on 2026-10-04 from the [technical plan](r1-pulse-tapping-implementation-plan.md). Package publication and deployment are separate steps.

## Delivered exercise

| Stage | Lessons |
|---|---|
| Guided pulse | Regular 4/4, 2/4 and 3/4 with a highlighted score guide. |
| Pulse by ear | The same metres with count-in guidance only. |
| Compound pulse | Two dotted-quarter pulses in 6/8; quiet three-way subdivisions either continue or disappear after count-in, first with a score guide and then by ear. |
| Skip beats | Hear every pulse, tap only 1 & 3 or 2 & 4. |
| Displaced clicks | Tap every main beat against clicks on 2 & 4, then against offbeat clicks. |

Fourteen lessons use four response bars, one count-in bar and five completed attempts. Each attempt selects a steady integer tempo from its hardcoded curriculum range; consecutive completed attempts do not repeat tempos. Guided/by-ear lessons use 70–100 pulse BPM, compound 60–90, skipped beats 70–110, and displaced clicks 75–110. These ranges are editable only in curriculum code, not in the global settings. Custom practice uses the shared interval-custom checkbox cards for multiple click patterns and metres. Each attempt randomly chooses a selected pattern, then a compatible selected metre; every selected pattern and metre must have a compatible match before Start is enabled. Regular pulse supports 2/4, 3/4 and 4/4, compound pulse supports 6/8, and skipped beats/displaced clicks support 4/4. Existing single-pattern/metre URLs and saved settings migrate to single-item selections. Custom practice exposes a minimum/maximum range within 40–180 pulse BPM (equal bounds mean fixed tempo), 2/4/8 response bars, optional visual guidance, compound subdivisions, selected skip beats, and 1–200 attempts or endless practice.

Rhythm settings live on the lessons page only: relaxed/standard/strict/custom tolerance, metronome volume with a four-beat preview at 90 BPM, and a separately previewable fast-attack tap sound (woodblock, kick or snare) with independent volume. Both Space and mouse/touch input are always enabled. Optional timing adjustment shows both input values together, each restricted to 0–250 ms and defaulting to zero. Previously saved negative adjustments reset to zero; historical results retain their original metadata. Keyboard and pointer adjustments are stored separately and frozen during an attempt. They are subtracted once to compensate for system lag; browser output-delay estimates are not subtracted again. There is no automatic fitting to answers or correction of early playing. The reusable timing package still supports signed offsets for other consumers.

Each target chooses its closest eligible tap in a fixed association window, with capture sequence breaking ties. Extra taps reduce accuracy. Feedback shows on-time/early/late/missed/extra counts, signed timing errors, median absolute error and drift when enough matches exist. Accuracy is on-time targets divided by targets plus extra taps. Each attempt passes at 80% or higher. A finite lesson passes when its average across exactly the requested number of completed attempts reaches 80%. The app shares this threshold across feedback, summaries and saved progress. Next attempt advances to a fresh tempo and the next slot. The final lesson result saves before the summary opens automatically, matching the other exercises. Summary is unavailable during practice; endless practice opens it only when Finish is pressed, keeping its full running average and the latest 50 reviews.

Suspension, focus loss, hidden tabs, source/configuration changes, stale clocks, overly delayed input and closing stalls interrupt without grading. Settings are frozen when entering the exercise; return to the lessons page to change them. The exercise uses Start tapping, Next attempt and the existing Back control; summary Retake resets practice. It has no partial-summary, duplicate Retry, Cancel attempt, New session or post-completion practice controls. Progress is stored by lesson and scoring policy; input/offset/clock details accompany a result without creating separate progress tracks.

## Ownership and affected modules

| Repository / package | Implementation |
|---|---|
| `web-audio` / `@polyhymnia/web-audio/webaudio` | Click and synthesized percussion instruments; explicit playback duration and clock-bearing silence; signed paired output clocks with exact-source requests and cancellation. Existing `time()` behavior remains compatible. Changeset included. |
| New sibling `rhythm` / `@polyhymnia/rhythm` | DOM-free, dependency-free plans, non-repeating bounded tempo selection, pulse cue generation, arbitrary target matching, timing metrics and optional adjustment estimation with caller-supplied reliability gates. |
| `@polyhymnia/rhythm/browser` | Neutral audio/runtime ports, simultaneous keyboard/pointer timestamp input binding with independent offsets, and a framework-independent attempt controller. Owns capture bounds, warm-up, source locking, interruption and delivery draining. |
| `@polyhymnia/rhythm-react` | React peer hook, caller-styled beat guide and timing plot. No app theme, router, storage, lessons or concrete audio backend. Changesets included for both rhythm packages. |
| Ear-training app | `src/exercises/pulse-tapping/`: options, generators, curriculum and custom search. `src/exercises/shared/rhythm/`: product session and progress policies. `src/components/rhythm/`: setup, timed runner, feedback and summary. `src/lib/rhythmSound.ts`: audio port adapter. Pulse routes, homepage entry and generated route tree. |
| App shared shell / development | `WorkshopPage` accepts optional sound controls. `LessonFrame` and `LessonSummaryFrame` share the established masthead, Back control, stepper, action styles and summary shell with the existing discrete exercises. The homepage groups exercises into Intervals, Chords and Rhythm. `scripts/dev-link.mjs` links/restores built local packages without writing local paths into dependency files. Vite allows assets from installed/linked package roots so local notation fonts load. |

Notation and music-theory need no feature changes. Existing pitch runners use the shared presentation shell while keeping their exercise behavior. Tap-back, reading and silent-bar exercises supply different stimuli/phases/targets through the same rhythm contracts. The vanilla example in `rhythm/examples/vanilla.ts` demonstrates another host without importing app source.

## Local use and release

From the workspace parent:

```sh
pnpm -C web-audio build
pnpm -C rhythm install
pnpm -C rhythm build
pnpm -C polyhymnia-ear-training install
pnpm -C polyhymnia-ear-training dev:link
pnpm -C polyhymnia-ear-training dev
```

The link command also expects the existing notation/music-theory local packages to be built. Open `/exercises/pulse-tapping`. Use `dev:unlink` before installing or committing the app; relink for further local work.

The rhythm repository is published at [github.com/adrian729/rhythm](https://github.com/adrian729/rhythm). The app uses public npm ranges for `@polyhymnia/web-audio`, `@polyhymnia/rhythm` and `@polyhymnia/rhythm-react`, all at `^0.2.0`. A fresh install builds without local package links. GitHub Pages deploys merged changes on `main` after its production build succeeds.

## Verification and remaining device checks

Typechecks, tests and production builds pass for audio, rhythm and the app using local packages. The audio suite covers duration/end/clock contracts; rhythm covers sparse matching, compound targets, offset padding, adjustment reliability and headless lifecycle failures; app tests cover variant semantics, exact session length/retries/endless retention and policy-specific persistence.

Packed consumers verify Node scoring without DOM types (`skipLibCheck: false`), React public declarations and server rendering with host styling in React 18 and 19, and the standalone vanilla adapter's declarations. Headless Chrome checks keyboard, mouse and emulated touch attempts, custom/offbeat practice, absent response guidance, summary/restart, focus interruption and a real Web Audio attempt without React or animation frames. The app runs these flows in React StrictMode. These checks verify event/timing behavior; they do not verify perceived sound or physical touch latency.

A browser finding changed startup: output-latency fields can initialize after resume. The controller now warms up for at least 100 ms and requires two advancing continuous pairs from the preferred available source before locking. A regression test covers initialization during warm-up. The total preparation budget remains one second; an unavailable clock yields an interrupted attempt that can be restarted.

Music accompaniment remains deferred. Automatic interactive adjustment is also deferred pending listening and physical-device trials; manual adjustment/reset/skip is available now, and the pure estimator already supports multiple rounds and explicit reliability gates. Before enabling suggested adjustment, validate actual old hardware, Bluetooth/wired outputs, physical keyboards/touch devices and browsers beyond Chrome. Calibration must distinguish a consistent measured bias from variable lag and must never silently change tolerance.


## Review corrections

The latest audit fixes two input problems. Numeric settings retain an editable draft so sequential typing can pass through incomplete or out-of-range values without losing digits; only valid values persist, and blur restores the last valid value. The keyboard binder clears its held-Space state on focus loss, allowing the next press even if the key was released in another window. A public-API regression test reproduces that lost-keyup case and verifies listener cleanup. The approved user-facing lag range is 0–250 ms, independently for keyboard and pointer, with zero as the default; a storage regression covers migration of old negative settings without rewriting historical results.

After these fixes, app and rhythm typechecks, tests and builds pass (55 app tests and 11 rhythm tests); audio typechecks and its 10 tests also pass. Chrome checks cover sequential numeric entry, invalid-value recovery, separate saved adjustments and reset, all three tap previews, metronome preview cancellation, lost-keyup recovery, Space scroll prevention, interruption/restart, mixed pointer/keyboard capture, end summary, retake and existing interval answers. Emulated touch confirms pad feedback, Back navigation and no horizontal overflow at 390 px. Short visual feedback is observed across its transition rather than requiring it to remain active after an automation round trip.

Immediate input confirmation is independent of grading: the pad changes colour for 180 ms and plays the selected percussion voice even before starting. Its label stays `Tap`, with `key Space` below, using the existing interval-comparison Same tile's ornament, sizing and typography. The exercise shows one status prompt in the existing prompt style; task prose, tempo/range metadata, response/tolerance metadata, completed-attempt text, received-input counters and clock diagnostics are omitted. The shared progress stepper remains. The guide is one bar of MNX notation rendered with the same shared mensural music font as the existing exercise scores. Its time signature shows the metre: quarter notes for simple metres, dotted quarters for the two larger 6/8 pulses, and rests for skipped targets. Existing Notation.Playback highlights follow the attempt audio clock and repeat each response bar. Count-in notes are blue and dim until active; response highlights use the primary colour. By-ear variants hide the response score. Custom attempts announce their selected tapping task before the response begins and retain the pattern/metre in each final review. Feedback uses a separate instrument and never replaces timed metronome playback. Space is reserved for tapping while the pad is available (including focused buttons); editable controls are exempt in the reusable input binder, and Enter retains action-button activation. Holding Space cannot create repeated taps. Focus uses `preventScroll` and a reserved guide row avoids shifting the pad when count-in begins.

After an attempt, the pad and score disappear. Passed/Not passed and Next attempt appear above the complete timing feedback so navigation does not require scrolling. Next attempt starts a fresh tempo/attempt within the same lesson and consumes one next slot; a start guard rejects duplicate starts and attempts after finite completion. Retake resets practice from the end summary and rebinds input to the remounted pad. Leaving an incomplete attempt does not score it. Browser review covers Space on the pad and on a control, scroll prevention, immediate visual confirmation, mouse/touch input, graded mixed inputs, attempt progression and route stability, persisted settings, both sound previews, and real offline Web Audio rendering of all three percussion choices. Offline renders verify nonzero sound and short decay; perceived loudness and physical device latency still need human checks.

The final summary follows the existing exercise layout: score and navigation above expanded review cards. Each card keeps tempo, accuracy, all tap counts, median signed and absolute error, drift and the timing plot. Accuracy is shown once per card, the plot legend once per summary, and timing metrics use a compact line. Custom practice has no overall lesson Passed/Not passed marker; individual attempts still show their result against the same threshold.
