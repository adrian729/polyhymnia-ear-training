# Rhythm exercises plan

Selection agreed on 2026-10-04. Pulse tapping is implemented. The six next starter exercises were accepted for implementation on 2026-10-05: [accepted starter specifications](exercises/rhythm-starter-specs.md). The historical pulse proposals below are retained for context; the implementation documents describe its settled behavior.

Technical planning for the complete first exercise: [R1 pulse tapping implementation plan](exercises/r1-pulse-tapping-implementation-plan.md). Finish pulse tapping and its selected variants before implementing the other exercises; their shared requirements inform the design now.

Research and the full candidate list: [Rhythm exercise candidates](rhythm-exercise-candidates.md).

## Agreed selection

Ordered approximately by the difficulty of their introductory versions. Pattern complexity, tempo, length, metre, and available guidance can change that order.

| Order | Exercise | Why include it |
|---|---|---|
| 1 | Pulse tapping | Establishes a steady beat, which supports every other rhythm skill. |
| 2 | Rhythm clap-back / tap-back | Builds listening and rhythmic memory without requiring notation knowledge. |
| 3 | Rhythm recognition | Connects heard patterns to notation before asking learners to write them. |
| 4 | Metre identification | Develops awareness of beat grouping and simple versus compound metre. |
| 5 | Rhythm reading / sight-reading | Turns written rhythms into accurate performance. |
| 6 | Rhythm error detection | Trains precise comparison between a score and its performance. |
| 7 | Rhythm dictation | Combines listening, memory, and notation in an independent answer. |
| 8 | Silent-bar timing | Develops an internal pulse when an external timing reference disappears. |

### Variations within these exercises

| Variation | Parent exercise | Purpose |
|---|---|---|
| Skipping beats | Pulse tapping | Tap selected beats while maintaining the underlying pulse. |
| Displaced-click timing | Advanced pulse tapping | Maintain the main beat while clicks mark backbeats or offbeats. |
| Subdivision switching | Rhythm reading / tapping | Move between eighths, triplets, and sixteenths while keeping the beat constant. |
| Heard-change detection | Rhythm error detection | Compare two heard patterns without a score; start with same/different rhythm. |

### Deferred candidates

| Exercise | Reason to defer |
|---|---|
| Polyrhythm coordination | Requires more advanced coordination and a separate input design. |
| Melodic dictation with rhythm | A later bridge between pitch and rhythm exercises. |
| Drum-style identification | Better suited to a later styles and groove strand. |

## Planning process

Discuss and settle one exercise at a time, starting with pulse tapping. For each exercise, define:

1. The skill being trained and what counts as a successful answer.
2. What the learner hears, sees, and does; count-in, replay, retry, and feedback behavior.
3. Easier-to-harder variations, plus independent dimensions such as tempo and length.
4. Lesson presets and free-practice settings, separating learning aids from assessment.
5. Scoring, tolerance, progress tracking, and accessibility.
6. Existing capabilities, missing capabilities, owning packages, and technical decisions.
7. A small initial implementation and later extensions, with acceptance criteria.

Record decisions and unresolved questions before moving to the next exercise. Revisit shared infrastructure as later designs reveal requirements; avoid fixing an API around only the first exercise.

## R1: Pulse tapping — draft for discussion

### Goal and proposed interaction

Tap the steady underlying beat, rather than every note onset in the accompaniment.

Proposed initial input: a large touch/mouse pad and the Space key. Physical clapping is possible as personal practice, but automatic microphone scoring and MIDI input are deferred.

Use short attempts: explicit Start, one bar of count-in, four bars of tapping, then feedback and retry/next. Start with a moderate tempo, provisionally 70–100 beats per minute, and broaden towards both slower and faster tempos. These durations and ranges are proposed defaults, not settled requirements.

Count-in taps do not affect the score, except a tap anticipating the first response target within its explicit early window. During a recorded attempt, Space taps rather than replaying sound. Provide a visible stop control. Interrupted attempts should restart with a count-in and should not become failed answers.

### Proposed progression

| Stage | Variation | What changes |
|---|---|---|
| A | Guided pulse | Regular clicks and a visual beat guide; tap every beat. |
| B | Pulse by ear | Remove the visual timing guide; retain regular clicks. Introduce accented groups of two, three, and four. |
| C | Compound pulse | Use click patterns to establish larger beats, starting with two dotted-quarter beats per 6/8 bar. Explain the target pulse before the attempt. |
| D | Skipping beats | Tap a specified subset, such as beats 1 and 3 or beats 2 and 4 in 4/4, without losing the underlying pulse. |
| E | Displaced click | Tap the main beats while clicks mark beats 2 and 4, then offbeats. Introduce each placement explicitly. |

These are learning stages, not a strict ranking of every possible configuration. Change one dimension at a time initially. Longer attempts, slower tempos, and weaker beat cues can be difficult even with simple metre.

Keep full silent-bar practice in its separate exercise. Subdivision switching belongs to the reading/tapping strand; the target here remains the chosen underlying pulse.

Pulse in music is a deferred extension, outside the initial rhythm rollout. Prioritize the core exercises before building an accompaniment catalogue.

### Proposed answer and feedback rules

- Define the target pulse explicitly. Do not silently accept half-time, double-time, or an alternative offbeat phase. Any alternative pulse must be an intentional setting with its own target grid.
- Match expected beats and recorded taps one-to-one, in temporal order. A tap cannot satisfy two beats; missed beats and extra taps must affect the result.
- Report how many beats were on time, with early, late, missed, and extra taps. Separate consistent early/late placement from irregularity or gradual tempo drift.
- Show detailed timing only after an attempt. An animated guide is an explicit beginner aid, not always-on feedback during assessment.
- Users must be able to choose scoring strictness. Proposed choices: Relaxed, Standard, Strict, and a custom timing window. Tolerance should account for tempo and remain smaller than half the distance between neighboring targets. Exact thresholds, pass criteria, and how extra taps affect a percentage need to be agreed and validated before release.
- Keep scoring strictness separate from timing compensation. Do not automatically shift each exercise attempt to obtain a better score. Browser output-clock correction and any optional user-confirmed timing adjustment are applied before scoring.
- Save the effective tolerance, guidance mode, and timing-adjustment settings with results. Progress comparisons must account for different settings; changing tolerance must not silently rewrite previous results.

### Music source — deferred extension

Planning recommendation: return to this after the core rhythm exercises are working. A basic loop is technically straightforward, but a useful musical catalogue adds composition, controlled variations, listening review, and accompaniment/click balance. These are separate tasks with less immediate benefit than timing, input, scoring, and the other exercises. Do not build a general accompaniment generator as a prerequisite for rhythm training.

When revisiting the extension, consider a small set of original accompaniment templates authored for the app, played through the existing MNX/audio pipeline. The current app can build and play scores, but a rhythm-practice accompaniment catalogue and its variations still need to be created.

- Begin with a few musically coherent bass/chord patterns in simple metre. Clear bass attacks establish the beat; later patterns weaken those cues through rests and syncopation. Add compound-metre templates separately.
- Vary tempo, key, and approved rhythmic patterns within explicit constraints. Build the excerpt and its target pulse from the same musical definition and timeline. Preserve the generated example for repeat/retry.
- Review the templates by listening, including whether the requested pulse is perceptually clear. Random notes or a mathematically valid grid alone do not make a useful musical stimulus.
- Use the current instruments first. Balance the accompaniment and any optional teaching click; do not assume a drum-kit instrument or new sample library is available.
- Familiar tunes or real recordings are later content options. They require a defined content source and verified beat annotations; arbitrary-recording beat detection is outside the initial scope.

This would give control over the beat and difficulty without requiring a downloaded music library. Sound, variety, and content generation remain future decisions and do not block the current exercise designs.

### Timing on slower systems and optional setup

User requirement: support different system capabilities and allow the user to choose how strict scoring should be. An interactive timing setup is proposed, not yet agreed.

Distinguish a stable delay, which an offset can compensate for, from variable delay, dropped audio, or unreliable timestamps, which a single offset cannot fix. An older machine is not automatically inaccurate; assess the available timing facilities and observed technical problems rather than its age.

Proposed baseline behavior:

1. Prepare and schedule the short attempt before recording begins. Keep score generation, asset loading, and heavy rendering outside the recording window.
2. Relate browser input-event timestamps to the estimated audible output timeline. Do not use animation frames or the time a delayed event handler runs as the grading clock. Feature-detect timing APIs and define a fallback; avoid counting the same output delay twice.
3. Keep visual guidance lightweight and derived from the audio timeline. Actual display delay remains an uncertainty; visual guidance does not independently measure audio or input lag.
4. Where the app detects a technical interruption or invalid timing data, invalidate the affected attempt instead of recording a musical failure. Do not infer a technical failure merely from inconsistent tapping.
5. Offer user-selected tolerance and optional setup. Do not automatically widen tolerance from tapping variability, since that also measures the learner's current skill.

Proposed optional setup flow:

- Use the same keyboard or pointer input and audio output that the learner will use for practice.
- Provide an audible regular beat and a predictable moving visual guide. Ask the user to tap in time with the beat, rather than react after each flash.
- Allow four warm-up beats, then provisionally two short rounds of 8–12 measured taps. Four measured taps alone provide too little evidence for a stable estimate.
- Compare the median tap-to-beat offset and its consistency across rounds. Missed/extra taps or disagreement between rounds should prompt a retry or allow skipping setup, rather than produce a confident correction.
- Describe the result as an estimated timing adjustment, not a measurement of device latency. Offer preview, explicit Apply, manual adjustment, reset, and skip. Do not apply a correction automatically or alter the user's chosen strictness.
- Freeze the saved adjustment during exercises. Keep keyboard and pointer adjustments separate, and invite a new check after changing headphones, speakers, or input hardware. Automatic detection of every peripheral change cannot be assumed.

Limitation: tapping combines residual system delay, human anticipation/reaction, and visual/audio perception. A stable early/late bias can be the person's timing, so applying its inverse may hide a habit the exercise should train. This is why setup is optional and transparent; automatic browser timing correction is the first line of support. A [primary tapping study](https://pubmed.ncbi.nlm.nih.gov/19301250/) found different timing biases and variability for auditory and visual cues, supporting this caution. Precisely isolating physical input/output latency would require an independent measurement beyond this simple setup.

Initial implementation should include selectable tolerance and the reliable timing contract. Decide whether the optional guided adjustment ships immediately after validating it with real devices; do not promise that it resolves variable lag.

### Existing capabilities and implementation requirements

Findings from the current app and packages, reviewed 2026-10-04:

| Area | What exists | What needs to be defined or added |
|---|---|---|
| Audio scheduling | The app's `src/lib/sound.ts` schedules `NoteEvent` arrays through `@polyhymnia/web-audio`. | A crisp click sound independent of the learner's selected melodic instrument. Accompaniment mixing is deferred with pulse in music. |
| Timing | `Playback.time()` supplies elapsed playback time with an output/base-latency estimate. | A reliable public contract relating input event timestamps to the audible playback timeline, including before the first target. Audit this in `web-audio` before choosing an API. |
| Attempt duration | Playback completion currently derives from the end of scheduled notes. | An explicit recording window covering the last target's tolerance and any trailing silence. Later silent-bar and reproduction exercises will need this too. |
| Input | Existing exercises submit discrete answers. | Timestamped keyboard and pointer input; ignore held-key repeats, prevent duplicate events, and restrict capture to the active attempt. |
| Lesson flow | The shared runner grades each answer as a Boolean and supports playback/next shortcuts. | A count-in/recording/feedback flow and an agreement on how timing results map to lesson scores and saved progress. Reuse the lesson shell where appropriate. |
| Stimulus generation | Existing audio scheduling provides a basis for click patterns; MNX playback can support later score-based exercises. | Define click patterns and the target pulse from the same beat grid. Compound-metre targets must use the intended larger beat. Musical excerpts and recording beat detection are outside the initial scope. |
| Rendering | Pulse tapping can start without staff notation. | Beat guides and timing feedback in the app. Score-based variants later must use the existing notation packages. |
| Interruptions | The browser can lose focus or suspend audio during practice. | Define cancellation/restart behavior for hidden tabs, audio interruption, and navigation. Preserve completed results, not interrupted scores. |

Browser timing reference: [`AudioContext.getOutputTimestamp()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp) relates the output audio clock to the performance clock. [`Event.timeStamp`](https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp) provides the input event timestamp. These are ingredients for the timing contract, not a guarantee of complete device/input-latency correction; specify fallback behavior and assess calibration separately.

Cross-app reuse is an architectural requirement. Audio-clock and instrument capabilities belong in `web-audio`. A new public `@polyhymnia/rhythm` package owns pure target/pattern construction, matching, numerical timing diagnostics and adjustment estimation; its browser entry owns framework-independent input capture and attempt lifecycle through neutral playback ports. A separate `@polyhymnia/rhythm-react` package provides the thin hook and reusable guide/plot primitives. The app owns pedagogical presets, session/pass policy, persistence, routes and composed screens, and supplies its audio adapter. Notation remains clock-free. See the technical plan for proposed owner files, dependency boundaries and standalone reuse checks. Package changes must be exposed through public exports and released before the app depends on them.

### Proposed first implementation

Begin implementation internally with stages A and B: fixed tempo, simple metre, keyboard/touch input, short attempts, and useful timing feedback. Build the shared capture/scoring system so it supports tap-back, reading, and silent-bar timing. Then complete pulse stages C–E before implementing the other core exercises. Musical excerpts remain deferred until after that core rollout. See the linked technical plan for contracts, affected modules, scoring proposals, and sequencing.

Before implementation, settle the attempt model, visual guidance, pulse rules, tolerance/pass policy, audio timing contract, supported-device/fallback expectations, and whether optional timing adjustment belongs in the first release.

Acceptance checks should cover early/on-time/late taps, missed/extra taps, held keys and duplicate input, count-in exclusion, the last beat, trailing silence, and interrupted attempts. Verify delayed event delivery, fixed adjustment versus variable delay, fallback clocks, saved tolerance settings, and setup retry/reset behavior if included. Verify real keyboard and touch use with audible playback; mathematical matching tests alone cannot establish the user experience.

### Decisions awaiting discussion

1. Short graded attempts as the initial mode, with an ongoing practice mode later?
2. Visual beat guidance only in introductory practice, then faded out?
3. Which concrete lesson presets and custom settings should introduce each selected stage? Complete stages A–E before implementing another exercise.
4. Review the detailed technical plan's scoring, timing tolerance, and package contracts; validate its numerical defaults on real devices.

## Remaining designs

R2 tap-back, R3 recognition, R4 metre identification, R5 reading, R6 error detection, R7 dictation, and R8 silent-bar timing await individual discussion. Their accepted inclusion does not imply settled variations or implementation scope.
