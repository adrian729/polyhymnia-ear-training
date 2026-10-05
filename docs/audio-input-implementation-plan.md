# Audio input implementation plan

Prepared and reviewed 2026-10-05. This is the concrete delivery plan derived from [the research and Pitchy decision](audio-input-research.md) and [the tooling design and selected follow-ups](audio-input-tooling-plan.md). Implementation was authorized after the Astra High review. The research remains the source for alternatives and licensing, while this document governs the proposed work sequence.

Build browser-based, monophonic audio tooling in a new `audio-analysis/` repository, with three independently consumable packages. Validate it through a standalone browser example and pure sample analysis before integrating the app. Once the tooling is complete, add optional clapping to existing timed rhythm exercises and a single-note matching exercise with live pitch feedback.

## Review and implementation status

Astra High reviewed the plan twice. Round one identified bounded pitch history, sample eligibility for overlapping pitch windows, and the distinction between eligibility cutoff and processing tail. Those findings were incorporated into both plans; round two approved the revised plan without further actionable findings. A third review was unnecessary.

The new `audio-analysis/` repository now implements the three packages, browser assets, microphone/worker lifecycle, pure recorded/live pitch and onset analysis, sample-based holds, and standalone browser demos. `music-theory` exposes frequency/MIDI/cents helpers; `web-audio` exposes host-controlled audio-session policy; `rhythm/browser` accepts optional neutral sources with bounded final drain. Changelogs and public-contract tests accompany the owning packages.

Typecheck, tests, builds and packed consumers pass. The nested-URL browser checks cover generated microphone input, software loopback, explicit activation/release/denial, reference matching, and the real rhythm controller consuming the example clap bridge. Software-loopback timing is not microphone calibration. The detailed measurements and reproducible commands are in the sibling repository's `audio-analysis/VALIDATION.md`.

Real-source/hardware acceptance remains pending: real claps and voices, acoustic bias/jitter, playback leakage, and intended device routes. Physical input delay is still unknown. The user subsequently authorized publishing and consumer updates, then explicitly requested app integration. The app delivery below therefore exposes clap input as experimental practice, keeping microphone sessions out of saved lesson progress until real-device timing is evaluated. Existing unrelated app work is preserved.

## App integration — 2026-10-05

The user authorized implementing the two selected follow-ups after publication. Consume npm releases only; no package changes or new backend are required.

1. Add the three audio packages to the app and resolve their exported worklet/worker assets through Vite URLs. Preserve Pitchy/fft.js notices in the deployed worker and a public notices file. Verify both development and the nested Pages base.
2. Add shared app-owned microphone activation and cleanup. Permission follows a button press, never page loading or saved preferences. Borrow the existing playback context; coordinate and restore its audio-session policy. Handle denial, pending-request cancellation, faults, hidden pages, navigation and unmount without reviving cancelled sessions.
3. Compose an onset worker with the rhythm external-source contract in `src/lib/clapInput.ts`. Refresh the processing-clock estimate before each attempt, freeze a separate microphone adjustment, retain original sample timestamps and source identity, and acknowledge the final confirmation tail. Wire it into `TimedPracticeRunner` for pulse tapping, tap-back, reading and silent-bar timing. Keep native inputs available, mute their audible tap feedback while the microphone is enabled, and do not merge away real extra hits. Incomplete input interrupts rather than grades. Sessions that use microphone input remain separate from persisted lesson progress, including sessions that switch back to native input.
4. Add Pitch → Match a note to the exercise index. Use a live Pitchy worker and an app-owned matching policy composed with theory and the sample-hold primitive. The initial open-practice demo has been superseded by the reviewed consumer flow below: a lesson catalog, custom sessions, saved results and adjustable vocal ranges. Reference playback, output presentation and a settling interval precede a new eligible answer generation. Display Hz, detected note/octave, signed cents, silence/uncertainty and continuous-match progress. Reset incomplete holds on stale/unreliable input, reference replay and cancellation. No recording or upload is added.
5. Check the app's typecheck, focused public-contract tests and production build. Exercise permission denial/cancellation, worker/worklet loading, native input, live matching, clap finalization, navigation cleanup and narrow layouts through browser checks. Synthetic microphone checks demonstrate software behavior; they do not claim real voice/clap accuracy, calibrated input delay, speaker isolation or physical-device acceptance.

Following UI review, microphone activation and configuration live together in **Rhythm settings**, available on the Rhythm group page and timed lesson catalogs. Sensitivity uses the published onset-worker options: minimum RMS, rise ratio and minimum spacing. A separate microphone timing adjustment remains independent of native input offsets. Controls appear only while the microphone is enabled; one helper popup holds their explanations. Settings persist, but activation is never saved or restored automatically. The shared `MicrophoneProvider` is keyed by exercise group, carries explicit activation from settings into exercises and releases input outside that group. The enabled button itself turns blue and disables input when clicked. Its width remains constant through off, preparing and enabled states; one discriminated hook state updates activation and conditional fields together. Numeric field resets synchronize before paint. Hardware follow-up remains real claps/voice with headphones, measured bias/jitter against rhythm tolerances, room reverberation, speaker leakage, and intended mobile/Bluetooth routes.

Pitch uses the same provider, activation button and conditional sensitivity controls, with minimum RMS and pitch clarity in **Pitch settings**. Vocal-range controls are practice preferences and remain visible while the microphone is off. Six voice presets apply both MIDI bounds; the singer may then edit either endpoint without losing the selected kind, or choose Custom. Choices include every semitone in C2–F6, remain ordered, permit a single-note range, persist defensively, and restrict all generated targets. Presets use the conservative repertoire ranges in [Yale Library’s New Harvard Dictionary of Music table](https://yalelibrary.atlassian.net/wiki/spaces/YMD/pages/202030334); they are editable starting points, not a voice classification.

Match a note now uses the existing workshop/catalog, lesson frame, lesson-flow grading, result store, custom frame and summary components. Two five-note lessons require a continuous half-second or one-second hold within ±50 cents in the actual octave. At least four correct matches pass (80%). Skip is wrong; there is no time limit, and replay starts a new eligible answer generation. Microphone interruptions clear the unsubmitted attempt without adding an answer. Results are stored only for completed lessons; custom sessions support finite/endless counts, automatic continuation, tolerance and hold duration without lesson persistence. Analysis pauses at summaries while explicit activation remains available to disable or reuse for a retake. This consumer policy adds no package dependency or reusable tooling changes.

### App delivery and validation

Implemented the shared microphone controls and clap bridge, the Pitch group and Match a note page, published-package dependencies, exported asset URLs, generated routes and third-party notices. No reusable package source was changed for this integration.

App typecheck, **65 tests** (including two exercise-policy tests using the published Pitchy analyzer), and the production build pass. Chromium checks used generated microphone input and software-generated impact streams: A3 at 220 Hz matched after the answer boundary with zero credit during reference playback; octave errors and silence/reset behavior are covered by the exercise-policy tests. Pulse tapping, tap-back, reading and silent-bar attempts completed with microphone events and released tracks at their summaries. Click and Space remained usable following permission denial. Pending permission cancellation stopped a late-arriving owned track without reactivation; navigation released input and left it off on return; disabling during count-in interrupted without a result. Worker/worklet assets load under `/polyhymnia-ear-training/`, and Pitchy/fft.js notices remain in the deployed worker and public notices file. Pitch and rhythm interfaces were checked at 390, 768 and 1440 px without horizontal overflow.

These checks validate software composition, not physical acquisition latency or real-source detection quality. Before promoting claps to saved lesson progress, manually compare real headphone-based claps against the requested pulse at different volumes/tempos and check bias, jitter and duplicate attacks. For pitch, try real humming/singing across the offered range, an octave error, silence, reference replay and route/device changes. Speaker leakage and mobile/Bluetooth routes remain unvalidated.

After the settings and Pitch lesson revisions, typecheck and **66 tests** pass. Chromium verified preset selection, adjusted limits surviving reload, changing presets replacing both bounds, microphone resets preserving the vocal range, and a single-note range restricting lesson targets. A generated 220 Hz microphone stream completed a failed 20% lesson and an 80% passing retake, saving each completed result once. Reference playback earned no hold credit, and disabling released owned tracks. Settings were checked at 390, 768 and 1440 px; the shared helper popup now respects available viewport height. Pitch capture drains on normal consumer handoff instead of cancelling the prepared microphone, including React Strict Mode mounting and summary-to-retake transitions.

## Release record — 2026-10-05

Published the tooling to the public [audio-analysis repository](https://github.com/adrian729/audio-analysis) and npm:

- `@polyhymnia/audio-input`, `@polyhymnia/audio-analysis`, and `@polyhymnia/audio-analysis-pitchy`: **0.2.0**.
- `@polyhymnia/music-theory`: **0.2.0**; `@polyhymnia/web-audio`: **0.3.0**.
- `@polyhymnia/rhythm`: **0.3.0**; its React adapter: **0.2.1**, depending on rhythm ^0.3.0.
- Theory-dependent notation packages: `mnx-score` **0.3.1**, `notation-engine` **0.4.1**, and `notation-react` **0.4.1**.

The notation playground and this app use the published dependency versions. This release updates package dependencies and documentation; the app's clap and live-pitch controls remain the planned follow-ups. The independent laboratory remains in the audio-analysis repository. Real-source/device acceptance is still pending as recorded above.

### App release — v0.3.0

The app release ships microphone claps in the existing timed rhythm exercises, Pitch lessons and custom practice, editable vocal ranges, shared explicit activation and sensitivity settings, and accepted-hold pitch measurements on the guide and in summaries. It consumes the published tooling above and needs no new package release. Frozen-lockfile installation, typecheck, all 68 tests and a build with the GitHub Pages base path pass. Production-preview checks covered microphone activation, a successful 500 ms match and its measurements, navigation between groups, clap start/interruption, and all three deployed worker/worklet assets. A regression test protects provider ownership during navigation: input scope follows committed route matches rather than the new location while the old screen is still rendering.

## Scope and decisions

- Use Pitchy for monophonic pitch detection, isolated behind an adapter. Pin published `pitchy@4.1.0`; its tarball has an MIT licence and depends on `fft.js`. Preserve both packages' MIT notices in bundled distributions. The main branch's 0BSD licence differs from this published release.
- Use browser microphone capture and local processing. No backend, upload, account service, or storage service is needed for this scope.
- Support both already recorded PCM and live microphone samples through the same analysis functions. Include complete-file decoding as a browser adapter; encoded recording/export is outside this delivery.
- Keep pure packages independent of React, DOM, Web Audio, MNX, and application state. Musical frequency interpretation belongs in `music-theory`; target timing and matching belong in `rhythm`.
- Initial supported inputs are individual claps/impacts and one sustained voice or solo instrument. Validate voice first for the pitch exercise. This is attack detection, not a semantic classifier that can prove a sound was a clap.
- Build the reusable tooling first. App follow-ups are recorded at a feature level below; routes, lesson catalogues, detailed presentation, and persistence design remain separate.
- Defer melody segmentation/alignment, sing-back, sight-singing, polyphonic analysis, source separation, arbitrary-music beat tracking, MIDI input, and a new React audio package.

The three-package split and repository name are the defaults proposed for implementation. Public method names below are working names; settle their signatures with the first contract tests rather than creating an additional design phase for every helper.

## Ownership and dependencies

| Owner | Work | Runtime dependencies |
|---|---|---|
| New `@polyhymnia/audio-input` | PCM contracts and bounded collection; browser microphone lifecycle, complete-file decoding, capture worklet, clock estimates | None |
| New `@polyhymnia/audio-analysis` | Framing, level/quality measurements, onset detection, detector interface, pitch-track stability, browser onset-worker client | None |
| New `@polyhymnia/audio-analysis-pitchy` | Pitchy adapter and browser pitch-worker client | Analysis core and an exact pinned Pitchy release; Pitchy brings its own transitive dependencies |
| Existing `music-theory` | Pure frequency/MIDI/cents helpers, with explicit tuning reference | Remains dependency-free |
| Existing `web-audio` | Explicit host-controlled audio-session policy; existing playback and clock APIs | Remains a workspace leaf |
| Existing `rhythm` browser entry | Optional external-input readiness, interruption, bounded delivery and drain contract | No dependency on capture, DSP, Pitchy or Web Audio |
| Existing `rhythm` root | Reuse timing analysis; optional regular-pulse tempo estimator if needed | Remains dependency-free |

Capture and analysis exchange structural numeric data: sample arrays, sample rate, and frame positions. They do not import each other. The consumer joins clock metadata with analysis observations. Pitch observations stay in Hz; the consumer uses theory helpers to interpret them. No change to notation or MusicXML conversion is planned.

Proposed new repository layout:

```text
audio-analysis/
  packages/
    audio-input/src/
      index.ts, pcm.ts, collection.ts
      browser/{index,session,clock,decode}.ts
      worklet/capture.ts
    audio-analysis/src/
      index.ts, framing.ts, measurements.ts, onsets.ts
      pitch-detector.ts, pitch-track.ts
      browser/{index,onset-client}.ts
      worker/onsets.ts
    audio-analysis-pitchy/src/
      index.ts, detector.ts
      browser/{index,pitch-client}.ts
      worker/pitch.ts
  examples/browser/
  test/fixtures/
  scripts/smoke.mjs
```

Each package exposes a DOM-free root. Browser clients live behind `./browser`; worklet/worker assets have explicit exported paths. Bundle assets into browser-loadable files using a development-only build dependency. Consumers resolve asset URLs or inject workers; no CDN, Vite-only syntax, site-root URL, Blob URL, or special hosting headers are required. Use bounded transferable buffers initially, without requiring `SharedArrayBuffer`.

The example imports public exports and runs without app code or React. It may use the existing playback, theory and rhythm packages as consumers, but those dependencies do not leak into capture or analysis manifests. Include a Node consumer and packed browser consumer to check package boundaries.

## Contracts to implement

### Samples and capture lifecycle

Represent a capture epoch with its ID, actual graph sample rate, context-frame origin, and continuity/clock information. Every chunk carries its first frame position and sequence, with explicit gaps and overruns. Worker observations retain the epoch and analyzed frame range; delivery time is additional metadata, never the sound timestamp.

Use explicit permission preparation, capture start, cutoff/drain, cancellation, and disposal. Request permission only in response to activation by the host. Support an injected context and an existing stream, with ownership declared: dispose owned tracks/nodes, never close borrowed contexts or stop borrowed streams. Cancelled permission requests must clean up any stream that arrives later.

Keep microphone output silent. Report denied/unavailable input, muted/ended tracks, suspension, missing samples, and overload separately from ordinary silence. Choose and document a mono policy, expose settings actually obtained, and use the graph sample rate. Bound retained PCM by frames/bytes and analysis queues by batches; overflow invalidates the affected data rather than silently producing a grade.

Define two boundaries: the last sample eligible for assessment, and a later processing boundary supplying the tail needed to confirm eligible observations. Drain acknowledges processing through the latter and delivery of every eligible observation. Tail samples never extend onset eligibility or pitch-hold credit. Padding a final pitch window must not manufacture additional reliable hold duration.

### Pure analysis and musical interpretation

Framing accepts arbitrary chunk lengths and produces overlapping windows with documented frame ranges. Reset on gaps, sample-rate/epoch changes, or explicit cancellation. Signal measurements expose level and clipping so silence and unreliable observations can be gated.

The Pitchy adapter creates and reuses a fixed-length detector and returns frequency plus clarity. Core pitch tracking streams observations and retains only bounded rolling state for reliable regions and stability by default. Optional history belongs to an explicitly configured collector bounded by observation count or sample duration; neither an indefinitely running tuner nor its worker accumulates an entire track implicitly. Core does not snap pitches to a target, decide octave acceptance, or define exercise success. Pitchy itself supplies window-level Hz and clarity, not melody recognition or an exercise grade. [Pitchy API](https://github.com/ianprime0509/pitchy).

Provide a reusable sample-coverage hold primitive accepting explicit eligibility bounds and a consumer-supplied qualification result per observation. Accept only windows whose real, unpadded sample support is entirely inside the answer interval, reject stale generations, and credit unique continuous sample coverage rather than summing overlapping window lengths. An answer-start boundary resets any previous hold; gaps, unreliable input and failed qualification reset it. Target/tolerance decisions remain consumer-owned.

Add `frequencyToMidi`, `midiToFrequency`, and `centsBetweenFrequencies` to theory as proposed public helpers. Validate positive finite frequencies/tuning and finite MIDI input, preserve fractional MIDI, and default to A4 = 440 Hz. Leave the existing playback helper in `web-audio` intact; no new dependency between those packages is needed.

Start clap detection with adaptive energy rises and peak confirmation. Preserve the attack frame separately from confirmation time, and reject reverberant duplicate triggers. Configure minimum attack spacing independently of musical targets so valid subdivisions are not suppressed. Add spectral processing only if real recordings demonstrate that the simple detector is insufficient.

Use the same pure functions for recorded and live analysis. Live track processing is causal; any later offline refinement must be distinguishable. A regular-clap tempo estimator, if included, reports clap rate/regularity and its pulse assumption; known-tempo exercise scoring does not depend on it.

### Capture timing and rhythm integration

The first prototype must establish a useful processing-clock estimate before committing to accurate clap grading. Worklet context frames describe processed audio; `getOutputTimestamp()` describes output presentation. Neither directly measures physical microphone acquisition time. [Web Audio specification](https://www.w3.org/TR/webaudio/#dom-audiocontext-getoutputtimestamp).

Prototype repeated, bracketed observations of `AudioContext.currentTime` and `performance.now()`, correlated with worklet frame positions. Measure quantization, drift and load effects; compare possible mappings using known scheduled signals and a controlled acoustic or loopback check where available. Do not use message arrival as the sample origin or subtract output latency from an input timestamp without establishing the mapping's meaning.

The resulting record must identify the mapping method, measured uncertainty, continuity, and unresolved physical input delay. Freeze the validated mapping policy and explicit adjustment during an attempt; detect changes rather than fitting an answer to the targets. A microphone-specific fixed offset can compensate for a measured stable bias, but cannot repair jitter or dropped samples. Do not automatically align a user's claps to improve their score.

Extend `rhythm/browser` additively with a neutral external-input source contract: readiness before timed playback, timestamped events with source/generation identity, interruption, a caller-defined eligibility cutoff, and bounded completion/drain. The concrete capture bridge belongs in consumer composition initially; promote it to a reusable export only if another consumer demonstrates duplication.

Separate permitted detector delivery age from clock freshness and native event limits. The current controller rejects events older than its delivery grace; adding only a final drain would still reject those events. Keep native defaults, support a validated per-source allowance, and wait for every active source to drain before publishing a completed result. Missing drain, overruns, route changes, or stale generations interrupt instead of grading incomplete input. The eligibility cutoff accounts for the configured input-offset range. The separate processing boundary includes detector tail, without admitting attacks after the eligibility cutoff.

## Delivery phases

### Phase 1 Capture and timing prototype

Recheck repository instructions, current public APIs and unpublished changes before editing. Existing rhythm and playback work is active, so use its current public contracts and avoid overwriting concurrent edits. Create the new repository with its own instructions, MIT package licences, pnpm workspace, changesets, and a minimal plain-browser example.

Implement the smallest capture worklet, epoch records, explicit permission/cleanup, exported asset loading, and timing probe. Keep worklet work limited to sample transport; use actual block lengths rather than assuming a fixed block size. [Worklet processing API](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process).

Exit evidence: load a packaged worklet under a nested URL, capture ordered samples, cancel safely, establish a bounded cutoff, and report what the clock estimate measures. Record uncertainty and remaining input lag. If it cannot support the intended rhythm tolerance, continue pitch and offline analysis, and resolve the timing limitation before enabling scored clapping.

### Phase 2 Pure sample analysis and Pitchy adapter

Finish DOM-free PCM validation/collection, framing, measurements, detector port, Pitchy adapter, and reliable pitch-track output. Add theory frequency helpers in their owning repository. Pin the published Pitchy version and keep it out of core and capture dependency trees.

Exit evidence: Node analyzes supplied PCM without browser globals; chunked and contiguous input preserve frame placement; gaps reset stability; synthetic fundamentals, harmonics and alternate tuning exercise meaningful frequency/quality contracts. An extended-stream test proves bounded rolling state. A hold-contract test covers a reference-straddling window, overlapping coverage, stale generations and final padding. Inspect packed exports and declarations. Pitch-only observations remain separate from musical target decisions.

### Phase 3 Browser capture and recorded/live pitch

Complete microphone sessions and file decoding, plus a lightweight capture worklet and pitch worker using the pure pipeline. Provide sync PCM analysis and browser worker clients with explicit lifecycle, bounded transport, epoch/generation checks and final acknowledgements. The host owns whether to retain PCM; transferring analysis buffers must not detach its retained copy.

Add a host-callable audio-session policy API in `web-audio/src/webaudio/context.ts` and export it through the browser entry. It must work when the shared context already exists; a creation-only option would miss that case. Preserve existing playback callers, feature-detect the policy, and let the host coordinate activation/restoration. Capture must not independently write a competing global policy.

Exit evidence: the standalone example runs a live tuner and analyzes a completed capture or decoded file. Silence/uncertain data never leaves a stale confident pitch; suspension/disposal and delayed permission do not leak resources or revive cancelled work. Validate real voices, including lower fundamentals and octave mistakes, and record responsiveness separately from pitch accuracy.

### Phase 4 Clap detection and sample-based onset output

Add the pure onset detector and packaged onset-worker client. Validate real claps, quiet/loud attacks, room reverberation, non-clap impacts and close attacks; expose limitations rather than claiming general sound recognition. The example shows onset confirmations and a completed onset timeline.

Exit evidence: one attack does not routinely become multiple events, legitimate subdivisions survive, and event frame placement is independent of worker delivery delay. Use retained fixtures with known provenance and compare live/offline results for the causal detector. Choose parameters from those observations. Tempo diagnostics can be added here if useful, but are not a prerequisite for the selected exercises.

### Phase 5 Rhythm source integration

Implement the neutral source contract in `rhythm/packages/rhythm/src/browser/{ports,controller}.ts`, with public exports and a changeset. Preserve keyboard/pointer behavior. Compose a microphone source with existing playback in the standalone example, first comparing completed onset data with pure `analyzeTiming`, then exercising the live controller's cutoff/drain behavior.

Exit evidence: delayed but eligible onsets are counted once; events outside the adjusted window and events from old attempts are excluded; an eligible attack confirmed in the detector tail survives finalization, while an attack originating in that tail is excluded; source timeout/failure interrupts. Native input still works without a microphone source. Assess signed timing bias, jitter and missed/extra events against the actual tolerance intended for the exercise. Start with headphones; speaker support requires separate leakage checks.

### Phase 6 Tooling acceptance and package preparation

Run each affected repository's typecheck, public-contract tests with the dot reporter, and build. Pack and consume the artifacts from scratch projects. Verify browser assets on a static host with a nested base path, DOM-free root declarations, transitive dependencies/notices, and a plain-browser example independent of React or app source.

Use a few contract tests covering chunk/gap placement, pitch/tuning, duplicate attacks, ownership/cancellation and cutoff/drain races. Browser checks cover permission outcomes, repeated activation/deactivation, suspension, quiet/noisy input, low voice, playback contamination and UI load. Record the hardware/browser routes actually checked; do not infer untested mobile or Bluetooth timing from desktop results.

Prepare README/API examples, measured support limits, and changesets in each owning repository. No publishing or pushing occurs under this planning request. App integration must use public package exports; when releases are authorized, publish/bump consumers through the workspace's normal versioned dependency process. Local validation may use the existing temporary development-link workflow, removed before app commits.

Tooling is ready for consumer work when both standalone paths run from packed packages, required lifecycle/timing checks pass, limitations are documented, and no capture/DSP dependency has entered the existing pure packages. Phrase segmentation and performance alignment are not required for this gate.

## Follow-ups once the tooling is ready

### Microphone clapping in existing timed rhythm exercises

Add optional clap input to the shared timed-rhythm flow, retaining click/touch and Space. Start with pulse tapping, then validate reading, tap-back, silent-bar timing and other existing timed variants using their current phases and target attacks. Reuse matching and feedback; no separate clap curriculum or tempo recognition is needed.

Microphone input starts disabled. Only explicit activation requests access; previously granted browser permission does not auto-enable the feature. Finish permission and preparation while idle, before an attempt. Denial, cancellation or unavailable input leaves native input usable. Disabling or leaving the feature releases owned capture resources. Changing the source during an attempt follows the interruption contract.

Preserve source identity, freeze microphone-specific adjustment independently of native offsets, and drain before grading. Keep native inputs available, but check acoustic keyboard/pointer attacks and emitted tap-feedback sounds for duplicate capture. Do not hide real extra claps by merging every nearby event. Validate headphones first; speaker use is supported only where playback/feedback contamination has been controlled and checked. Source separation is outside this plan.

Detailed app controls and settings placement will be planned against the completed shared runner. Preserve existing scoring policies and exercise behavior unless review explicitly changes them. This step consumes the packages; it must not copy their detection, lifecycle or timing code into the app.

### Single-note matching with live pitch feedback

Play one reference in a comfortable range, wait for playback and an explicit acoustic-settling interval to finish, then let the user hum/sing and hold the note. Advance the answer-start frame through that interval, begin a new answer generation, and reset the hold. Only windows fully supported by real samples after that boundary may count; ignore reference-straddling windows and queued results from earlier generations. Display detected note/octave and cents deviation, with explicit uncertain/silent states. Compare the actual octave. Reset the hold when reliable input is lost, the capture epoch changes, or the pitch leaves tolerance; measure unique continuous eligible sample coverage rather than UI delivery time or the sum of overlapping window lengths.

Use the same explicit microphone activation, Pitchy worker and theory helpers. Reference playback cannot count toward success. An initial ±50-cent tolerance and 500 ms hold are proposed demo parameters to validate, not a settled curriculum. Target choice and success policy remain consumer-owned. This requires neither rhythm clock synchronization nor melody alignment.

Both follow-ups occur after tooling acceptance. Their exact app presentation and release order can be settled then; the selected work does not depend on deferred melody features.

## Completion and deferred work

The initial implementation is complete when reusable input and analysis packages support bounded capture, recorded PCM/file analysis, reliable live monophonic observations and clap onsets; theory and rhythm expose the required public contracts; and independent consumers demonstrate both paths with documented timing/source limits.

Future exercises can reuse those observations. Introduce segmentation and a separate pure performance-assessment package only when sing-back or sight-singing is selected and requires repeated-note handling or sequence alignment. Do not add these capabilities as prerequisites for either selected follow-up.


### Pitch UI review

Pitch lesson entries and custom Start require a prepared microphone. While input is off, Pitch settings show “Microphone required to start” with the enable button directly below it, without extra explanatory copy or a navigation button. The same section contains the enabled toggle and sensitivity controls once input is ready. Disabled entries carry a bold “Microphone required” label; this prerequisite is neutral guidance rather than an error. There is no redundant microphone heading in Rhythm settings. Direct lesson URLs show setup before the exercise. Pitch settings use the existing form typography and hairline dividers, with one helper popup and editable vocal range.

Practice uses the shared lesson frame, progress, verdicts, actions and summary. Each question plays its reference automatically; reference and voice notes, a flat/sharp guide, and a continuous-hold bar provide focused feedback. Live readings are suppressed during reference playback. Input loss pauses practice without discarding completed answers; setup offers explicit resume. Retake also checks the prerequisite, while summary replay does not need microphone access. Replay after an answer retains its verdict and pauses automatic continuation.

Successful matches retain minimum, maximum and time-weighted average detected frequency for exactly the required hold (500 ms by default). The pitch guide freezes a min–max band and average marker in their actual positions relative to the reference; a table shows Hz and cents. Measurements are included for each successful answer in the session summary. Only unique eligible sample coverage contributes, overlapping windows are not counted twice, and coverage beyond the required duration is clipped. Reset, silence/uncertainty, out-of-tolerance pitch or a gap discards an unfinished hold’s measurements. Reference/foreign-generation data cannot contribute. No PCM or recording is retained for these statistics.

Validation: typecheck, all 68 tests and production build pass. Chromium with simulated microphone input covered disabled lesson entries, direct URLs, denied permission, explicit start, automatic references with zero hold credit during playback, review replay, pause/resume with retained answers, 20% failed and 80% passed summaries, retake with input off, custom start, and the mobile helper popup. A varying 218–222 Hz simulated voice exercised the actual Pitchy worker and verified the accepted min/average/max, corresponding guide positions, replay preservation, summary retention, exclusion of skipped answers and clearing for next question/retake. Layouts were checked at 390, 768 and 1440 px; real microphone hardware remains outside these simulated checks.
