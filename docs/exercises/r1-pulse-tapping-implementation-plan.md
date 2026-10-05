# R1: Pulse tapping — technical implementation plan

> Updated after implementation review: five attempts per rhythm lesson; simultaneous Space and click/touch with immediate visual/percussion feedback; hardcoded per-lesson tempo ranges (custom practice alone exposes min/max); settings/previews and both offset fields on the lessons page only; user-facing lag adjustments restricted to 0–250 ms, default zero; shared lesson presentation; no New session button. See [implementation and verification](r1-pulse-tapping-implementation.md) for the current behavior. Historical numerical proposals below are superseded by these decisions, including the signed user-facing adjustment proposal. Signed offsets remain supported by the reusable package.


Status: implemented locally, 2026-10-04, following the user's implementation approval. See [implementation and verification notes](r1-pulse-tapping-implementation.md) for the delivered behavior, browser findings and release prerequisites. Product context: [rhythm exercises plan](../rhythm-exercises-plan.md). The remaining proposal language records the original technical plan.

## Scope and implementation order

Finish the pulse exercise, including guided pulse, pulse by ear, compound pulse, skipping beats, and displaced clicks, before implementing the other exercises. Build and verify regular pulse first, then add the remaining pulse variants to the same system. This is an internal sequence, not a proposal to abandon the advanced variants.

Music accompaniment remains deferred. All stimuli in this scope are authored click patterns, synthesized with Web Audio; no recordings, music generator, sample library, microphone detection, MIDI input, or notation renderer is needed. Silent-bar timing remains a separate exercise. Its needs influence the timing contract now.

Recommended initial interaction: select settings, enter the exercise, explicitly start an attempt, hear one bar of count-in, tap for four bars, inspect feedback, then retry or advance. Finite lessons use five attempts by default; custom practice can use the existing 1–200 count range or endless short attempts. Endless does not mean one indefinitely scheduled audio stream.

The detailed defaults below are recommendations for discussion and device validation, not previously agreed requirements. Architectural requirement: reusable rhythm capabilities belong in public packages from the first implementation, so other apps can consume them without importing this app's source.

## What later exercises need from the same work

| Exercise | Reusable features | Additional requirements later | Consequence for this implementation |
|---|---|---|---|
| R2 Tap-back | Click audio, count-in, timestamp capture, target matching, feedback | Listen and response phases; irregular target onsets; an optional reference beat during response; replay before attempting | Separate audio events from answer targets; represent explicit phase durations and response windows. |
| R5 Rhythm reading | Capture, tolerance, missed/extra scoring, tempo controls | MNX display and performed attack targets, including rests, ties, tuplets; subdivision switching | Scoring accepts arbitrary increasing onset times. Keep score-to-target conversion outside the timing core. |
| R8 Silent-bar timing | Output clock, targets, same tapping input, drift feedback | Several audible/silent sections; continued scoring through silence; return of the reference click | Playback duration must be independent of the final audible event. |
| R3 Rhythm recognition | Click sound, numeric tempo, later rhythmic stimulus playback | Answer choices and notation snippets | Reuse the existing discrete-answer runner; do not require timed capture. |
| R4 Metre identification | Accent patterns and explicit pulse/metre definitions | Listening examples and answer choices; richer musical cues eventually | Reuse generic pulse/cue pattern builders; pedagogical presets and answer rules remain exercise-owned. |
| R6 Error detection | Pattern playback and later score/stimulus generation | Controlled changes to a pattern; score comparison or two-listen comparison | Keep original and altered stimulus definitions separate from their answer data. |
| R7 Dictation | Pattern playback, tempo, later score generation | Notation answer editor, comparison rules, answer submission | No editor or symbolic rhythm comparison belongs in the current timing core. |

This supports reuse through a few concrete contracts. It does not require a universal exercise engine or settling all later exercise designs now.

## Current architecture and affected modules

Repository audit: app and local `web-audio` on 2026-10-04. The installed audio package is currently 0.1.0. Some older exercise documents reference obsolete paths; this plan uses the current source layout.

| Existing module | Current behavior | Proposed impact |
|---|---|---|
| `web-audio/src/webaudio/player.ts` | Schedules all `NoteEvent`s; end derives from final note; `Playback.time()` clamps to zero and estimates output delay; `finished` reports ended/stopped/blocked | Add explicit duration and a paired output-clock snapshot. Preserve existing playback behavior when new options are omitted. |
| `web-audio/src/webaudio/context.ts` | Shared audio context and gesture unlock | Reuse public `createAudioContext()`; pulse startup explicitly resumes/checks it before scheduling. No global latency-hint change initially. |
| `web-audio/src/instrument.ts` and `src/webaudio/index.ts` | Instrument scheduling seam and public Web Audio exports | Implement/export a small click instrument and new player types from the Web Audio entry. Keep the root package entry free of browser APIs. |
| App `src/lib/sound.ts` | Lazy melodic player using the selected synth/sampler | Keep its API; use a separate rhythm adapter/player so melodic sample preparation and instrument selection do not affect click timing. |
| `src/exercises/shared/playing.ts` and `session.ts` | `slow`/`medium`/`fast` mean note durations; options support discrete questions and auto-next | Pulse uses numeric pulse BPM and its own option validation. Reuse question-count helpers where useful; do not reinterpret the existing tempo enum as BPM. |
| `src/exercises/shared/lessonFlow.ts` | Boolean answers; session score is the fraction of correct answers | Keep that flow for existing exercises. Add an app session adapter around the rhythm package's numerical results; the app owns graded slot/retry/pass rules. |
| `src/exercises/shared/store.ts` and `src/lib/storage.ts` | Best score/pass/attempt count per lesson; defensive JSON IO but loose result shape checks | Reuse storage IO; add a versioned rhythm store with validated policy-specific records. Expose a `LessonResult` adapter to existing lesson tiles. |
| `src/components/lesson/LessonRunner.tsx` | Playback, a discrete answer, feedback/summary; Space replays; Boolean grading | Add a dedicated timed runner. Reuse layout controls, not its answer/keyboard state machine. |
| `src/components/lesson/LessonSummary.tsx` | Binary answer score and correct/wrong cards | Add a rhythm summary for accuracy, timing diagnostics, and attempt review. Extract shared presentation only if it removes actual duplication. |
| `src/components/lesson/WorkshopPage.tsx` | Workshop shell always includes `InstrumentSelect` | Add an optional sound-control slot, defaulting to the current instrument selector. Pulse supplies click-volume/setup controls. |
| `src/components/lesson/LessonRoutePage.tsx`, `LessonListParts.tsx` | Generic lesson route and result tiles | Reuse via a pulse runner wrapper and selected-policy result adapter. Display the active scoring/guidance policy beside progress. |
| `src/components/custom/CustomFrame.tsx`, `src/components/custom/useStoredSearch.ts` | Settings screen, run screen, URL and local settings | Reuse. Its Start enters the run screen; the run screen has an explicit Start tapping action that unlocks audio and establishes focus. Device timing adjustment is local only, never encoded in a shared URL. |
| `src/routes/index.tsx`, exercise routes, `src/routeTree.gen.ts` | Static exercise catalogue and generated file routes | Add pulse entry and index/custom/lesson routes; regenerate the route tree using the existing tooling. |

No initial changes are needed in `music-theory`, `notation`, or `musicxml-to-mnx`. Later score-based tapping must use public `mnx-score` `buildTimeline({ scope: 'all' })` and `performance()` facilities. Do not copy internal engraving beat-grouping code or add clocks to notation.

### Reusable package boundaries

The earlier app-private capture/scoring proposal is superseded. Plan a new sibling `rhythm/` repository with a small package family, provisionally `packages/rhythm` and `packages/rhythm-react`, following the existing notation package-family precedent. Names and directory layout are proposals; no repository or package is created during planning. Each package has documented public exports and its own releasable version/changeset. Separate packages follow dependency/runtime boundaries, rather than creating a package per helper or exercise.

| Package / entry | Responsibilities from the first pulse implementation | Dependencies and exclusions |
|---|---|---|
| Existing `@polyhymnia/web-audio` | Click instrument, explicit playback duration, signed output-clock snapshots, playback cancellation/lifetime | Audio remains a leaf with its existing DOM-free root and browser entries. It does not know rhythm grading, React, lessons, or MNX. |
| New `@polyhymnia/rhythm` root | Immutable timed-plan/target contracts and validation; pure beat/cue pattern builders; tap matching and timing diagnostics; explicit tolerance/scoring functions; numerical result aggregation; optional timing-adjustment estimation | No runtime dependencies on React, Web Audio, notation, browser globals, routing, or persistence. Accept explicit options rather than app lesson IDs. Importable in Node or another UI framework. |
| New `@polyhymnia/rhythm/browser` | Framework-independent attempt controller; input timestamp normalization/binding; source locking/continuity checks; preparation/cancellation, offset-aware capture bounds, delivery draining and finalization | Uses the pure root plus DOM APIs through this entry only. Playback, clocks, event targets, lifecycle notifications, and scheduling are supplied through explicit ports/options. No concrete player, app singleton, storage, or React dependency. Another app can use a different sound backend. |
| New `@polyhymnia/rhythm-react` | Thin `useTimedAttempt` lifecycle/subscription adapter over the browser controller; reusable beat-guide and timing-plot presentation | Depends on rhythm through public exports and React as a peer. No duplicated matching/capture logic; no TanStack Router, app storage, shadcn, Catppuccin tokens, lesson catalogue, or audio singleton. Styling, labels, reduced-motion and accessibility options are exposed to the consuming app. |
| Ear-training app | Lesson presets and difficulty progression; settings screens; pass/retry/graded-slot policy; progress persistence and policy keys; audio backend adapter; routes and composed runner/setup/summary | Consumes public package APIs. Product defaults below live here; numerical package functions receive the chosen policy explicitly. |

Dependency direction: `web-audio` and the pure rhythm core remain independent; `rhythm/browser` consumes neutral playback ports; `rhythm-react` depends on rhythm and a React peer; the app depends on these packages and the existing notation packages. Nothing in this family imports the app. Browser and React entry points must not leak into the pure root's runtime or declaration imports. Declare React as a peer and test compatible versions; publish matching rhythm/rhythm-react dependency ranges and avoid bundling a second React instance.

The rhythm package provides reusable regular-pulse construction from pulse BPM, beats per bar, bar counts, target masks, cue placements, accents and optional subdivision cues. It returns cue data, targets, phases and a beat grid without MIDI pitches, oscillator settings, lesson IDs, or a compulsory visual guide. The app picks pedagogical combinations for A–E and maps cue data to audio `NoteEvent`s through its backend adapter. Tap-back and silent-bar plans can supply arbitrary targets and cue data through the same contract without using the regular-pulse builder.

Pure matching returns associations, signed errors, missed/extra taps and counts independently of the accuracy formula. An explicitly selected accuracy policy computes the proposed `onTime / (targets + extras)` result; package consumers can choose another formula without replacing capture or matching. Tolerance presets, five-attempt sessions and the 80% pass threshold are app configuration, not mandatory library behavior. Adjustment estimation likewise accepts explicit association and reliability gates; applying/persisting its recommendation remains the caller's decision.

### Browser integration and React seam

The browser controller accepts a neutral playback port: prepare/unlock under the caller's Start gesture, explicitly play silence for readiness checks, schedule an opaque stimulus with explicit duration/lead, sample a paired signed clock, report ended/stopped/blocked, subscribe to audio interruptions, and explicitly stop/dispose the owned handle. The app's small `rhythmSound` adapter maps this port to public `web-audio` APIs. It does not implement the capture, readiness, grace/drain or scoring algorithms. Audio-specific latency correction stays in `web-audio`.

The neutral clock snapshot contains `performanceTimeMs`, `playbackTimeSeconds`, an opaque source key and continuity metadata. The adapter translates the audio package's source/stage information; the controller freezes the chosen source and rejects lost/discontinuous clocks or changed latency stages. Document units, lifetime and invalidation requirements at the port boundary. Consumer-provided clock/event/timer ports permit deterministic contract tests; browser defaults are available only through the browser entry. No listeners, timers, animation loops or audio start at import time. The host explicitly starts, cancels and disposes an attempt; the React hook follows the same contract and cleans up on unmount/Strict Mode remount.

Proposed minimum playback-port shape (names provisional):

```ts
interface RhythmPlaybackPort<Stimulus> {
  clockSourcesByPreference: readonly string[];
  prepare(signal: AbortSignal): Promise<void>;
  validateStimulus(stimulus: Stimulus): { lastAudioEndSeconds: number };
  playSilence(options: PlaybackOptions): RhythmPlaybackHandle;
  play(stimulus: Stimulus, options: PlaybackOptions): RhythmPlaybackHandle;
}

interface PlaybackOptions { durationSeconds: number; leadSeconds: number }

interface RhythmPlaybackHandle {
  finished: Promise<'ended' | 'stopped' | 'blocked'>;
  clock(sourceKey: string): {
    performanceTimeMs: number;
    playbackTimeSeconds: number;
    sourceKey: string;
    continuityKey: string;
  } | undefined;
  onInterrupted(listener: (reason: string) => void): () => void;
  stop(): void;
}
```

`playSilence` creates a real clock-bearing handle without inventing an empty value for opaque `Stimulus`. Source keys are backend-owned and ordered by preference; the host can exclude unacceptable fallback sources. `clock(key)` returns that exact source or `undefined`, never automatic fallback. Every snapshot uses the same performance time origin as normalized input events; playback time is signed relative to that handle's scheduled start. The mapping already includes the backend's output-delay estimate, so the controller applies only the explicit user offset. `continuityKey` changes when source identity, output route or latency-stage configuration invalidates a previously sampled mapping; the controller also checks numerical continuity. A handle's clock remains usable after natural `ended` until stop/replacement/interruption; stopping is idempotent, invalidates that handle and cannot stop a newer playback. A backend unable to meet these requirements cannot enable graded capture. Aborting preparation must prevent subsequent scheduling by that attempt even if a backend's underlying resume promise cannot itself be cancelled.

Opaque stimuli also prevent the controller from silently inserting count-in beats or shifting audio. The regular-pulse builder accepts an explicit minimum count-in duration and regenerates cues, phases and targets together. For an arbitrary plan, the host supplies sufficient count-in/lead. The controller derives and validates the earliest raw input boundary against listener attachment/readiness; insufficient margin returns a preparation error with the required margin, which the host resolves through its builder. No arbitrary stimulus-rebuild callback is needed in the initial API. The controller never shifts targets alone or drops eligible early taps. Any rebuilt plan is validated and fixed before playback begins.

One injected runtime port supplies monotonic `nowMs()`, the corresponding epoch time origin, and cancellable browser-task scheduling. Its default uses `performance.now()`/`performance.timeOrigin` and browser tasks. Paired snapshots, normalized input timestamps, delivery delays, heartbeat boundaries and finalization deadlines must all share that domain; no direct global clock reads bypass injected ports. Event targets from a different realm/time origin require explicit normalization or rejection. Compare continuity keys by exact opaque equality within the active handle, alongside exact source-key equality and numerical continuity checks; a changed key interrupts rather than recentering. The controller's scheduled tasks keep running when there is no visual subscriber.

Attempt phases and capture/technical interruption state belong to the browser controller. Lesson progression, feedback navigation, retry slots, pass markers and summary navigation belong to the app. The hook exposes observable phase/result state and commands; it does not reproduce a second controller inside React. Visual frame sampling never schedules audio. Notation stays clock-free, and `web-audio` stays free of UI timers.

For later rhythm reading, place the adapter from public `mnx-score` performance events to rhythm targets outside the dependency-free core. Initially it may be a thin consumer adapter; if reused, give it an optional integration entry or package with explicit notation dependencies. Preserve rests, ties, performed repeats and simultaneous-attack source IDs. No notation changes are required for pulse.

### New app integration modules

- `src/exercises/shared/rhythm/session.ts`: app-owned continuous-score lesson progression, fixed graded slots/retries, completion and bounded endless review, using package results/aggregation.
- `src/exercises/shared/rhythm/store.ts`: validated/versioned preferences and policy-specific progress, using existing storage IO.
- `src/lib/rhythmSound.ts`: backend adapter connecting neutral rhythm ports/cue data to public audio APIs and app volume settings.
- `src/components/rhythm/TimedLessonRunner.tsx`, `TimingFeedback.tsx`, `TimingSummary.tsx`, `TimingSetup.tsx`: app flow and copy, composed from the package hook/visual primitives and existing layout components. No app-private matching or browser-controller implementation.
- `src/exercises/pulse-tapping/`: `options.ts`, `generator.ts`, `catalog.ts`, `customSearch.ts`, `store.ts`, and `index.ts`. Its generator configures the reusable pulse builder and supplies lesson-specific metadata, not a second beat-grid implementation.
- `src/routes/exercises/pulse-tapping/`: `index.tsx`, `custom.tsx`, `lesson.$lessonId.tsx`, and `-Runner.tsx`.

Reuse acceptance: a scratch vanilla-browser consumer can build, run and finalize a pulse attempt using public rhythm/browser APIs and a small audio adapter, without any ear-training source, React or visual frame subscription. A scratch Node consumer can import the root and score irregular targets without DOM globals, and typecheck its packed public declarations with no DOM library and `skipLibCheck: false`. A minimal React consumer can mount the hook/guide with caller-provided styles and labels without the app theme, router or storage. These are packaging/public-contract smoke checks, not a second maintained product. No general quiz engine, notation editor, accompaniment generator, or app-specific design-system package is needed for this exercise.

Proposed owning files in the new repository:

- `packages/rhythm/src/index.ts`, `types.ts`, `plan.ts`, `pulse.ts`, `matching.ts`, `metrics.ts`, `adjustment.ts`: pure contracts, validation/builders and numerical operations. The root exports only this layer.
- `packages/rhythm/src/browser/index.ts`, `ports.ts`, `controller.ts`, `input.ts`: explicit browser entry, neutral runtime contracts, attempt orchestration and event normalization/binding. Small lifecycle/drain helpers can remain internal rather than becoming more packages.
- `packages/rhythm-react/src/index.ts`, `useTimedAttempt.ts`, `BeatGuide.tsx`, `TimingPlot.tsx`: React peer adapter and composable visual primitives. Visual styles are caller-configurable and optional; importing the root rhythm package never pulls these in.

Pin these responsibility/export boundaries before implementation. Refine exact function signatures while completing the first A/B slice; do not move implemented rhythm logic into app files simply to get that slice working.

## Attempt plan: sound and answer are separate

Proposed contract sketch; field names may be refined during implementation without changing these responsibilities:

```ts
interface TimedAttemptPlan<Stimulus, TargetMetadata = unknown> {
  durationSeconds: number;
  phases: readonly {
    kind: 'countIn' | 'listen' | 'respond';
    startSeconds: number;
    endSeconds: number;
  }[];
  stimulus: Stimulus; // Opaque to scoring/capture; interpreted by the playback adapter.
  targets: readonly {
    targetId: string;
    atSeconds: number;
    associationRadiusSeconds: number;
    metadata?: TargetMetadata; // Caller-owned; matching never inspects it.
  }[];
  responseWindow: { startSeconds: number; endSeconds: number };
}
```

All times use the same playback-relative origin: zero is the scheduled start of the count-in. Seconds are audio/plan units; input timestamps and user offsets are explicitly named milliseconds. Plans are fixed before scheduling. `durationSeconds` is the musical plan duration; offset-aware capture padding is derived separately at runtime. The root validator checks finite positive duration, ordered phases, sorted distinct targets inside the response window, and finite positive association radii with disjoint windows. The playback adapter validates stimulus-specific properties, including all audio tails within duration, and provides `lastAudioEnd` for padding. Reject malformed plans before playback. A scored plan needs at least one target. The app's stimulus can contain `NoteEvent[]`; a different consumer need not use MIDI events. Feedback metadata can contain bar/beat/source-note IDs without exposing MNX types in the core.

For skipping beats, clicks remain on every beat and targets contain only the requested beats. For displaced clicks, clicks occupy the announced backbeats/offbeats and targets remain on the main beat. For silent-bar timing later, targets continue through silent phases. No target is inferred from the presence of an audible note.

Pulse generation uses integer beat positions, with half-beat offsets for displaced clicks, and converts to seconds once with `60 / pulseBpm`. The reusable builder also provides a beat grid for an optional visual guide. Later rhythm-reading adapters supply arbitrary performed attack times; do not reconstruct ties or repeats from raw MNX in this core. Simultaneous attacks become one tap target with source IDs retained for feedback; tied continuations are not additional targets.

Do not join phases by the last audible note's end. Existing `concat()` shifts by audible event ends and cannot preserve a silent response or trailing bar; use explicit phase offsets/durations instead.

## Audio package contract

### Explicit playback duration

Extend `Player.play` options with `durationSeconds?: number`, in addition to the existing `lead`. With an explicit duration, playback includes silence until that time and may have no audible events. Duration must be finite/nonnegative and at least the last event's end; reject truncating durations. Existing callers that omit it retain note-derived completion.

`finished` still returns `ended`, `stopped`, or `blocked`. Treat `ended` as the audio-node end signal with estimated output padding, preserving the existing scheduling contract; it does not prove the locked output clock has reached the requested duration or that queued DOM input has arrived. Timed capture additionally checks the locked clock's signed playback time against runtime duration before sealing. Explicit stop/replacement cancels scheduled clicks and settles once. Audio scheduling uses Web Audio nodes, with no timers or animation loops in the package.

### Paired output-clock snapshot

Add a public Web Audio playback method, provisionally `clock(requestedSource?: PlaybackClockSource): PlaybackClockSnapshot | undefined`. Declare it optional on the existing public `Playback` interface to preserve compatibility with consumer-created handles; players created by the package implement it. Pulse checks for it before enabling graded capture:

```ts
type PlaybackClockSource = 'outputTimestamp' | 'latencyEstimate' | 'uncorrected';

interface PlaybackClockSnapshot {
  performanceTimeMs: number;
  playbackTimeSeconds: number; // Signed; relative to the scheduled start.
  source: PlaybackClockSource;
  // For latencyEstimate: identifies present stages, including valid zero values.
  latencyStages?: { baseSeconds?: number; outputSeconds?: number };
}
```

The pair represents one position on the estimated audible timeline. For a DOM input event:

```ts
rawTapSeconds = snapshot.playbackTimeSeconds
  + (event.timeStamp - snapshot.performanceTimeMs) / 1000;
correctedTapSeconds = rawTapSeconds - savedInputOffsetMs / 1000;
```

Prefer `getOutputTimestamp()` and subtract the playback's scheduled context start from its `contextTime`. Its `performanceTime` is already paired with output; do not subtract another latency estimate. Reject uninitialized zero pairs, nonfinite values, unavailable output, or an interrupted clock. This API pairs clocks; it does not measure physical keyboard/touch latency. See [the output timestamp contract](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp).

Fallback: pair `performance.now()` with a closely sampled `currentTime`, subtract the scheduled start and the available processing/output latency estimate. Use `baseLatency + outputLatency` when both are finite and nonnegative, the one available stage otherwise, and no subtraction for an uncorrected clock. Record which stages exist, including legitimate zero values. Current `Playback.time()` uses `outputLatency ?? baseLatency ?? 0`, which is inadequate as a precision contract. These distinct stage definitions are documented in [Web Audio's latency attributes](https://www.w3.org/TR/webaudio/#dom-audiocontext-baselatency). The fallback is approximate and needs real-device comparison; it must not be presented as calibrated hardware latency.

Keep existing clamped/frozen `Playback.time()` semantics for current score playback. New timed UI uses the paired clock so its guide and grading agree; it may clamp for display only. The new method supplies a running-context pair even after natural completion, until explicit stop/replacement, context interruption, or disposal invalidates that handle. `stop()` after `ended` invalidates its clock without resettling the promise or calling `instrument.stopAll()` against a newer playback. Separate clock validity from promise settlement; current `player.ts` returns from `stop()` when already done, which must be corrected for this contract. The browser controller explicitly stops its owned completed handle through the adapter after finalization.

Without a requested source, `clock()` returns the best currently usable source. With a requested source, it returns only that source or `undefined`; it never silently falls back. The browser controller selects through the adapter during preparation, freezes that choice for the attempt, and requests it on every later call. Check availability/continuity and latency-stage changes throughout capture; source locking does not mean ignoring changing output latency. A lost source, context suspension, or discontinuous mapping invalidates the attempt. Feature detection is required on older browsers.

### Click instrument and preparation

Add `web-audio/src/webaudio/click.ts`: a short oscillator/envelope instrument behind existing `Instrument`. Accent and normal clicks use fixed, distinguishable MIDI pitches and velocities, with very short attacks and roughly 30–50 ms total tails. No dependencies or samples. Keep `NoteEvent.id` absent for synthesized clicks: that field is reserved for MNX IDs; target IDs are separate.

The app audio adapter uses its own player/instrument on the shared context, with independent volume frozen during an attempt. The reusable browser controller orchestrates readiness through the neutral port. Preparation originates from the explicit Start gesture, resumes audio, and verifies running state. Bound the whole preparation, including potentially pending `resume()`, with a provisional one-second readiness budget. Use a silent warm-up playback and sample its clock across separate browser tasks, requiring at least two advancing, continuous snapshots. Select a validated fallback if the preferred source remains unavailable; do not infer this from the first zero pair. Stop the warm-up handle, schedule a fresh count-in with a small lead, and verify its selected source before the earliest raw capture boundary. If cancelled or timed out, later promise resolution cannot start a stale attempt. Failures record no result. No samplers, score generation, or storage IO run inside capture.

## Input, phases, and lifecycle

The reusable controller owns `ready → preparing → countIn → respond → finalizing → completed`, with `interrupted`/`disposed` paths. The shared phase contract can insert `listen` later. The app maps completed attempts to its feedback/summary screens and graded-session state. An attempt generation token guards every promise, animation callback, queued event, and completion signal; cleanup is idempotent, including React Strict Mode remounts. The React hook subscribes to the controller rather than implementing this state machine again.

Select keyboard or pointer input explicitly for an attempt, so the correct saved adjustment is used. Keyboard: native `keydown`, Space only, ignore `repeat`, exclude text fields and unrelated controls. Pointer: native `pointerdown` on the large pad, primary pointer/left button only; do not also score click, touchstart, or pointerup. Configure the pad to avoid scrolling/double-tap gestures. No arbitrary debounce that would reject legitimate fast rhythms later.

The Start activation is never a tap. During count-in, hold the pad focus but ignore count-in targets; release any held Start key before admitting the first tap. Avoid document-wide interception of Space on other buttons. On feedback, shortcuts can advance/retry; during capture Space has exactly one function. Keep a reachable stop button and a text explanation of the selected target pulse. Screen readers receive phase changes and feedback, not announcements on every beat. Reduced-motion mode uses discrete beat indicators.

Use native `Event.timeStamp`, not handler execution time or animation-frame elapsed time. Validate its performance-clock origin, finite value, and plausible relation to the active attempt. Modern timestamps are relative to the relevant time origin and can have reduced precision, as documented in [MDN's timestamp contract](https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp). If supporting a legacy epoch-based timestamp, normalize a clearly identified epoch with the supplied runtime time origin (browser default `performance.timeOrigin`); do not guess by replacing an invalid timestamp with handler time. Unusable timestamps produce an ungraded retry/explanation.

Determine phase and eligibility from corrected event time, even when an event is delivered after a phase transition. Pulse uses the full response span so tapping a skipped beat counts as an extra. Extend eligibility backward only for the first target's early association window; the remaining count-in is ungraded. For pulse, the nominal response end is the following bar's downbeat, which is explicitly excluded. Other generators may provide a longer response window if their final target is close to its end.

Derive bounds before scheduling. With first target `t0`, its radius `r0`, nominal response `[S, E)`, saved offset `o = offsetMs / 1000`, and delivery grace `g`:

```text
corrected eligibility [L, U): L = min(S, t0 - r0), U = E
raw timestamp eligibility:   [L + o, U + o)
collection deadline:         audible performance time of U + o, plus g
runtime playback duration:   max(plan.durationSeconds, lastAudioEnd, U + o) + g
```

Positive offsets mean observed taps arrive late, so subtract them once before eligibility and matching. Attach listeners before `L + o`; verify lead/count-in provides enough time for negative offsets, extending the count-in rather than silently dropping an early eligible tap if it does not. Padding is silent and does not extend musical eligibility or create new targets. If raw capture ends before the musical/audio plan does, retain the appropriate lifecycle until both collection and playback completion conditions are satisfied. Inputs exactly at `U` are excluded; credit thresholds inside the window are inclusive.

At the nominal response end, stop showing an active tapping prompt; listeners remain attached until the actual result seal. Provisional delivery grace is 250 ms, independent of musical tolerance. Project the raw closing boundary into performance time using the locked clock. Measure normalized event delivery delay as `runtime.nowMs() - normalizedEventTimeStamp` (browser default `performance.now()`); retain a controller-owned browser-task heartbeat through capture/finalization (provisionally every 50 ms). Before freezing, require `finished === 'ended'`, locked playback time at least runtime duration, and the collection deadline to have passed. Also require no eligible event to exceed the delivery bound and no heartbeat gap greater than that bound to overlap the closing interval from raw capture end until seal. Check both recorded gaps and the still-open gap `now - lastHeartbeat` immediately before sealing, so callback order cannot hide an overdue heartbeat. Uncertain coverage produces an ungraded retry. A visual-frame gap elsewhere does not invalidate accurate timestamped input. Do not grade directly from `finished` or assume one extra task proves delivery. Validate events arriving after that signal, stalls beginning just before the deadline, and a finalization callback running before the overdue heartbeat. No finite grace guarantees delivery under arbitrarily long freezes; thresholds remain device-validation choices.

The browser controller uses its supplied browser-task scheduler to sample clock health, advance phases and check finalization independently of visual rendering. The React adapter or another host observes that state/clock for visuals with a caller-controlled frame subscription. No UI frames schedule clicks or gate attempt completion. Store taps in a mutable attempt buffer, with occasional UI updates; render the detailed graph after capture. Do not write to localStorage per tap. Detect context non-running state, hidden document, window blur, navigation, explicit stop, output-device change when exposed, or invalid/discontinuous mapping and cancel without increasing the graded count. A slow visual frame alone is not evidence of bad musical timing or broken audio. Keep completed attempt results when an active attempt is interrupted.

## Scoring and progress

### Association and tolerance

Separate diagnostic association from the window that earns credit. Generators provide each target's radius, capped below half its nearest target spacing (provisionally 45%). Every pulse target is additionally capped at 45% of the underlying pulse interval, including sparse skipped-beat patterns. A tap on a skipped beat therefore cannot become a late match to a distant selected beat. Irregular-target generators later supply appropriate endpoint spacing. Validate that target intervals are disjoint; no ambiguous reassignment or silent rephasing is allowed.

Sort eligible taps by corrected timestamp, retaining their capture sequence as a stable tie-break. Disjoint target intervals mean each tap can belong to at most one target. Choose the closest tap within each interval; ties go to the earlier captured tap, and remaining taps are extra. This yields the maximum number of associations and minimum total absolute error without dynamic programming. No fitted phase shift, tempo rescaling, or recentering. Unmatched targets are missed; unmatched eligible taps are extra. Associated taps outside the credit window are early/late, not also extra. Equal timestamps from coarse browser precision remain separate taps rather than being silently deduplicated.

Proposed tolerance presets: Relaxed = smaller of 120 ms and 20% of one pulse; Standard = smaller of 80 ms and 12%; Strict = smaller of 40 ms and 6%. Custom requests 10–250 ms. Effective credit radius is the smaller of the requested window and association radius, and is shown to the user; both association and credit boundaries are inclusive, while response end remains exclusive. For later irregular patterns, use neighboring target spacing to prevent overlapping credit windows. These are starting values to validate, not research-derived standards.

Credit is inclusive at the threshold. Signed error is corrected tap time minus target time: negative early, positive late. Report target count, on-time, early, late, missed, extras, median signed error and median absolute error for associated taps. Pulse-specific drift compares error against target time when sufficient matches exist; display diagnostics as approximate and avoid strong tempo conclusions from sparse matches. Guidance or setup never shifts an attempt to improve these metrics.

### Percentage and lesson behavior

Proposed attempt accuracy: `100 * onTime / (targetCount + extraTapCount)`. Misses and associated early/late taps reduce the numerator; unrelated extra taps increase the denominator. Example: 16 targets, 14 on time, one late, one missed, two extra → 14/18 = 77.8%. Four perfectly timed taps cannot earn 100% against 16 expected beats. No tap earns partial timing credit initially; retain millisecond feedback to show improvement inside/outside the chosen window.

Session score is the mean of completed attempt accuracies. For fixed presets all attempts use the same length/settings. A finite graded lesson contains exactly `N` finalized graded attempts and passes at an unrounded mean of at least 80%. Interrupted attempts do not count. Custom/endless practice has accuracy summaries without a passed lesson marker. Round only for display. Persist finite completion when the Nth result finalizes, before opening the end summary. A session ID makes persistence idempotent even if callbacks repeat.

Show feedback between attempts. Before attempt `N`, Next attempt starts the next plan at another tempo within the lesson range and consumes the next graded slot; it preserves the earlier result. After attempt `N`, open the summary automatically, including final-attempt feedback in its expanded review. Keep the full timing information with compact labels and one shared plot legend. The summary offers Retake to reset practice. Do not show a partial summary or post-completion retries. Endless practice opens its summary when Finish is pressed. An interrupted attempt offers Try again and restarts without consuming a slot. Do not replace a completed poor attempt with a better retry. Default to manual next between attempts; any later automatic next must retain review time and must not inherit the binary runner's correct-answer shortcut.

### Storage

Use a new versioned rhythm storage key, not the existing loose Boolean-answer result store. Validate persisted JSON shapes/ranges and treat unknown versions as unavailable preferences/results. Preserve old pitch exercise storage unchanged.

Progress key: exercise/lesson ID + scoring-policy version + tolerance preset/custom value + guidance mode. Lesson ID fixes tempo/metre/length; any mutable setting that changes difficulty must also enter the policy key. Do not pool strict and relaxed, or visually guided and ear-only best scores. Timing correction itself is recorded as metadata, with clock source and input method, rather than generating a new progress key for every offset. The visible lesson tiles show results for the active policy, with explicit labels when viewing another policy. Setup never changes an already saved score.

Persist unrounded best percentage, passed flag, completed session count, policy/settings, and compact summary metadata. Distinguish `lastRecordedSessionId` for duplicate-save protection from `bestResult.sessionId` and its settings/diagnostics. A worse session updates the former and completion count while preserving the best result's identity/metadata. Together with the attempt/session generation guard, this prevents duplicate callbacks from recording the same single-runner session twice. Keep raw tap data in memory rather than accumulating it in localStorage. Finite sessions are bounded by the existing count limit; endless sessions retain 50 detailed attempts plus aggregate totals. Start new sessions when tolerance, guidance, input method, BPM, or correction changes; freeze settings during an active attempt.

## Pulse variants and settings

Default guided lesson: 70–100 pulse BPM, four response bars, one count-in bar, Standard tolerance, both keyboard and pointer input, no saved adjustment. Custom range provisionally 40–180 pulse BPM and 2/4/8 response bars. BPM always counts the explicitly requested pulse, not every notated denominator unit.

| Stage | Concrete introductory preset | Audio versus target | Guidance/difficulty |
|---|---|---|---|
| A Guided | 4/4, 90 BPM, every quarter-note beat | Count-in and response click every beat, accent first beat; target every beat | Large visual beat indicator. Add simple 2/4 and 3/4 after the first lesson. |
| B By ear | Same material, no animated response guide | Same sound and target; accented groups of 2, 3, 4 | Static metre/beat instructions remain. Change guidance before changing tempo or length. |
| C Compound | 6/8 with two dotted-quarter pulses per bar | BPM counts dotted quarters; two main clicks/targets. Introductory count-in and response include quieter three-way subdivisions to make compound grouping audible | Explain/count the two larger beats; never score all six eighths. Later lessons fade subdivisions, retaining a compound count-in. Subdivision aids enter the progress policy. |
| D Skip | 4/4, tap 1 & 3, then 2 & 4 | Response clicks on all four beats; targets only selected beats | Show selected beat numbers before starting; advanced presets have no animated response guide. Custom nonempty beat masks are validated. |
| E Displaced | 4/4, first clicks on 2 & 4, then on each eighth-note offbeat | Count-in gives all main beats; response click placement changes; targets still every main beat | Explain placement before starting. No flashing main-beat answer cue in assessed presets; guided custom practice is separately labelled. |

Each stage has a few focused lessons, not a cross-product of all settings. Metre/click placement combinations are validated: backbeat presets are 4/4; compound pulse is explicitly 6/8; unsupported combinations are not silently approximated. Accent and click volume remain consistent enough to identify the phase. Count-in length and instructions make the transition to the first response downbeat predictable; displaced-click presets do not secretly add main-beat response clicks. No phase inference from the user's first tap.

## Timing adjustment: optional, after the baseline works

Selectable tolerance and browser output-clock mapping ship regardless of guided adjustment. The recommended minimum is transparent manual adjustment, reset, and skip. Add the interactive assistant within the pulse work after checking it on real devices; defer its automatic recommendation if it cannot produce a stable, honest estimate. It does not block the five musical variants.

Flow: select the actual input method/output; use a fixed 90 BPM beat, four warm-up beats, and two rounds of 12 measured taps with regular audio and a predictable visual guide. Its 45% association radius is 300 ms, covering the permitted ±250 ms adjustment without crossing to an adjacent beat. Estimate median signed offset separately per round from browser-clock-mapped taps before applying any saved user correction. The proposal is a total replacement adjustment, not a corrected residual. Require sufficient one-to-one taps and agreement between rounds; provisional criteria are at least 10 matches per round, median difference at most 20 ms, and median absolute deviation at most 30 ms. These gates need usability validation and must not be described as a hardware-quality test. Otherwise offer retry/manual/skip and apply nothing.

Present the signed suggested adjustment and raw-versus-adjusted preview, then require explicit Apply. Proposed manual/suggested range is ±250 ms; larger values should prompt checking setup rather than fitting a different beat. Store keyboard and pointer corrections separately. Apply the saved value exactly once, freeze it during practice, and offer reset/recheck after output/input changes. Do not automatically widen tolerance or silently recalibrate from exercise answers.

This estimates a combined residual timing bias, including the person's anticipation; it cannot isolate device lag. Visual aids help understand the task but do not independently establish when the sound or physical input occurred. A primary study reports cue-dependent tapping biases: [auditory and visual sensorimotor synchronization](https://pubmed.ncbi.nlm.nih.gov/19301250/). Four measured taps alone are insufficient for a trustworthy adjustment, and no constant adjustment solves variable stalls.

## Implementation sequence and acceptance

1. **Audio owner first.** Implement public paired clock, explicit duration, click instrument, and exports in `web-audio`; add its changeset. Verify existing score/melodic playback compatibility. Document source/fallback and lifetime semantics.
2. **Reusable rhythm owner.** Establish the new package family, pure-root/browser export boundaries and neutral ports. Implement plan validation, pulse building, ordered matching/metrics and browser capture/finalization with a fixed 4/4 plan. Add the thin React hook and guide/plot primitives. Verify public imports in Node and minimal vanilla/React consumers; record package changesets. No lesson or persistence assumptions enter these packages.
3. **Complete A/B app slice.** Wire the audio adapter and package hook/visuals into the app timed runner, feedback, summary, custom settings, lesson routes, workshop sound slot and homepage. Add app-owned session/pass policy and validated progress storage. Manually verify keyboard and touch; tune provisional tolerance and count-in instructions.
4. **Complete pulse C–E.** Add compound grouping, skipped target masks, backbeat/offbeat click placement and focused lessons. Verify each uses the same timing/scoring contracts. Do this before starting another exercise.
5. **Setup/device validation.** Verify fallback timing, manual adjustment/reset, and final-event draining on representative devices. Add the optional guided recommendation if its limits are clear and it behaves consistently. Adjust numerical defaults from these checks, versioning scoring changes.

When implementing locally, build the owning packages and extend `scripts/dev-link.mjs` for `@polyhymnia/rhythm` and `@polyhymnia/rhythm-react` in the new sibling package family; its current mapping lists only notation, music-theory and web-audio. Unlink before app commits. Keep cross-repository dependencies as published npm version ranges; internal package-family dependencies follow the owning repository conventions. Plan separate changesets for released audio, rhythm and rhythm-react changes, and update the app package manifest/lockfile only for released consumer versions. Changes remain in their owning repos. Package release and consumer range/lockfile updates require the user's release instruction; do not publish or push as part of planning/implementation alone. A deployable app must depend on released public APIs, never a committed local link.

Automated checks should be a few contract tests through public package entry points and the app integration: paired-clock mapping/sign/fallback/invalid states and legacy `time()` behavior; explicit silence/end/replacement behavior; irregular/missing/extra matching and boundaries; runner cancellation/final-tap/idempotent persistence. Use table-driven cases rather than one test per preset. Add pack/scratch-import smoke checks to verify the pure root has no browser/React dependency and the browser/React entries require no app sources. Run the relevant owner and app typecheck/tests/build, with `--reporter=dot` for tests. No tests have been run for this documentation-only work.

Real-device checks: desktop keyboard and mouse, touch, at least one slower/device-under-load case, output timestamps versus fallback, wired and wireless output where available. Deliberately delay input handlers, hold Space, switch tabs, suspend/resume audio, navigate during preparation, and change output. Check early/late first and last taps, positive/negative offsets, silent response tail, skipped-beat extras, displaced-click phase, and compound pulse labels. Mocks cannot prove audible synchronization or physical device delay. Record browser/device coverage and any limits rather than claiming universal accuracy.

Implementation-ready when the signed output-clock/lifetime contract, explicit duration, scoring policy, response/input boundary handling, and progress policy have agreed semantics and the real-device timing slice meets them. Remaining validation-dependent decisions are exact tolerance/setup gates, drain bound, and supported fallback accuracy. The architecture above does not depend on the final numerical choices.

## Review

Reviewed by **gpt-6-astra at xhigh**. It found the ownership/reuse approach feasible and appropriately scoped, but identified contract gaps that were incorporated into this revision:

1. Explicit clock source requests, warm-up readiness, and clock invalidation separate from natural completion/promise settlement.
2. Corrected/raw eligibility equations, offset-aware silent padding, and measurable bounded input delivery/finalization checks.
3. Pulse-period caps on every association radius; disjoint-window matching instead of unnecessary dynamic programming.
4. Exactly `N` graded slots, defined retry behavior, completion saved before summary, and idempotent session metadata.
5. Audible compound subdivisions in introductory lessons and setup measurements taken before saved user correction at a fixed tempo.

In a focused second pass, Astra confirmed the earlier high-severity blockers were resolved. Its final clarifications were incorporated: verify completion against the locked clock rather than the legacy end signal alone; check the unfinished heartbeat gap at seal; distinguish last-recorded and best-result session identities. The full preparation timeout includes pending audio resume.

A further Astra xhigh review addressed the user's cross-app package requirement. It confirmed that two packages plus a browser entry are proportionate and materially support reuse. Incorporated findings: explicit silent playback in the neutral port; count-in rebuilding by the host/builder rather than mutating opaque stimuli; exact source selection and post-end clock lifetime; one injected clock domain; controller completion independent of visual frames; and packed declaration checks without DOM types. No further high-severity architecture blocker was identified.

Device-dependent numerical values remain provisional. Review validates the design reasoning; it does not substitute for implementation checks or audible real-device testing.
