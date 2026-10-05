# Audio input: tempo and pitch recognition

Research and decision recorded on 2026-10-05. This is a planning note, not an implementation specification or authorization to install dependencies. No audio-input implementation accompanies it.

## Agreed scope and choice

- Recognize one sound source at a time: singing or a solo instrument. Polyphonic recognition is outside the desired scope.
- **Choose Pitchy for pitch detection**, both for analyzing a completed recording and for live feedback.
- Clap/rhythm recognition needs a separate onset detector; Pitchy does not provide it.

Recommended architecture: perform capture and analysis in the browser. None of the three capabilities below requires a backend. Package boundaries, device support, exercise behavior, and scoring still need decisions and validation before implementation.

## Why Pitchy rather than Essentia.js

| Consideration | Pitchy | Essentia.js |
|---|---|---|
| Pitch algorithms | McLeod Pitch Method (MPM). | YIN and probabilistic YIN (pYIN), among other algorithms. |
| Recorded and live input | Analyze successive sample windows with the same detector. | Supports offline and real-time analysis through a broader audio-analysis toolkit. |
| Integration | JavaScript detector taking samples and sample rate; returns frequency and clarity. | JavaScript bindings to an Essentia WebAssembly runtime, with additional pipeline and resource management. |
| Rhythm analysis | Separate onset detection required. | Includes onset and beat-analysis algorithms. |
| License | Published 4.1.0 is MIT; the main branch checked in the initial research is 0BSD. | AGPLv3; commercial licensing is advertised by UPF. |

Pitchy is the narrower fit for monophonic exercises and has a permissive license compatible with the app's MIT licensing. Essentia's wider toolkit does not currently justify its integration and licensing implications. This is a choice based on scope and simplicity, **not a measured claim that Pitchy is more accurate**. No comparative recordings or device benchmarks were made during this investigation. [Pitchy documentation](https://github.com/ianprime0509/pitchy), [Essentia.js repository](https://github.com/MTG/essentia.js), [Essentia.js algorithm API](https://mtg.github.io/essentia.js/docs/api/Essentia.html).

Pitchy's clarity value is an algorithmic signal-quality measure, not a calibrated probability that an answer is correct. The app still needs silence rejection, stability rules, note segmentation, and exercise-specific grading. A pitch detector alone does not transcribe or assess an exercise.

### Essentia licensing

Essentia.js is technically an option, but its repository is licensed under AGPLv3. A directly integrated browser application would need an assessment of the combined-work boundary; the practical planning assumption is that distributing the combined app entails AGPL licensing and corresponding-source obligations. Publishing a GitHub repository alone does not establish that all distribution requirements are met. Independent code and unrelated repositories do not automatically acquire AGPL licensing. [Essentia.js license](https://raw.githubusercontent.com/MTG/essentia.js/master/LICENSE).

AGPL permits commercial use and charging money. Although the Essentia licensing page describes its open license as being for “non-commercial applications,” the repository's AGPL text does not impose a blanket commercial-use ban. The relevant obstacle for this project is copyleft compatibility with the intended distribution, rather than whether the app charges money. UPF also offers commercial licensing; its price, scope, and coverage for this integration were not established. Moving analysis to a backend is not an automatic escape from AGPL obligations. [Essentia licensing information](https://essentia.upf.edu/licensing_information.html), [AGPL license text](https://raw.githubusercontent.com/MTG/essentia.js/master/LICENSE).

Release verification for implementation selected `pitchy@4.1.0`. Its published manifest and actual tarball licence are MIT, requiring preservation of its copyright and permission notice; its `fft.js` dependency is also MIT. The main branch inspected during initial research is 0BSD. Both are permissive, so this correction does not change the Pitchy decision. Bundled workers must carry the notices for the actual installed release and its dependencies. [Published Pitchy release](https://registry.npmjs.org/pitchy/4.1.0), [Main-branch Pitchy license](https://raw.githubusercontent.com/ianprime0509/pitchy/main/LICENSE).

Revisit Essentia only if later testing identifies a substantial benefit that warrants resolving those obligations or obtaining suitable commercial terms.

## 1. Tempo and rhythm from claps or other sounds

The useful intermediate result is a sequence of **onset timestamps**: when each clap or other attack occurred.

For a learner clapping a regular pulse, an initial tempo estimate can use `BPM = 60 / median(intervalsInSeconds)`, after rejecting duplicate detections and unsuitable intervals. This assumes each detected clap represents the requested beat. Missed claps, extra claps, and subdivision clapping can otherwise produce half-time or double-time estimates.

For exercise grading, compare detected onsets against the exercise's known target timeline. Average BPM alone cannot describe early/late placement, missed beats, extra attacks, or tempo drift. Keep the existing rhythm principles: ordered one-to-one matching, explicit target pulse, and no automatic shifting of an attempt to improve its score. See [rhythm exercise planning](rhythm-exercises-plan.md) for the existing context; this note does not change that rollout.

Required pieces:

1. Capture microphone samples and preserve their position on an audio timeline.
2. Detect increases in energy or spectral activity, using an adaptive noise threshold and peak selection.
3. Reject duplicate triggers from a single attack, reverberation, and background noise.
4. Convert peaks into onset timestamps and map them to the exercise's timing contract.
5. Estimate pulse tempo where useful, or grade the onset sequence against known targets.

An onset detector detects an attack, not the semantic fact that someone clapped. Taps, knocks, and other sharp sounds can trigger it. Supported inputs and noise conditions need testing. Spectral onset strength and peak picking are established ingredients; selecting a detector and its thresholds remains open. [Librosa onset-detection documentation](https://librosa.org/doc/main/auto_tutorials/01-intro/05-onsets.html).

The app's own metronome or feedback sound may leak into the microphone. Headphones or a listen-then-respond interaction simplify this problem. Simultaneous playback and capture require testing; echo cancellation can also affect the signal being measured.

Recognizing the underlying beat of an arbitrary musical recording is a separate, harder task involving onset patterns, tempo estimation, and beat tracking. A stream of note attacks need not coincide with the intended pulse. This is not a prerequisite for clapping exercises. [Librosa beat-tracking API](https://librosa.org/doc/main/api/generated/librosa.beat.beat_track.html).

## 2. Pitch from a completed recording

Recommended processing flow:

1. Obtain audio samples, either captured directly during the attempt or decoded from a complete recording/file.
2. Analyze overlapping windows with Pitchy using the actual sample rate.
3. Reject silence and unreliable frames; smooth stable regions without erasing genuine note changes.
4. Convert detected frequency to the exercise's pitch representation and cents deviation, using `@polyhymnia/music-theory` for musical pitch logic.
5. Segment the result into notes and align them with the expected answer where the exercise requires a sequence.
6. Apply the exercise's explicit pitch, octave, tuning, duration, and timing rules.

For a single sustained note, identifying a stable region may be enough. For a melody, segmentation is additional work. Repeated notes of the same pitch need evidence of a new attack or a gap; pitch changes alone cannot identify them. Breath noise, consonants, vibrato, slides, and instrument attacks need policies rather than being blindly counted as wrong notes.

Completed recordings allow looking at neighboring and later frames before deciding which regions are reliable. Essentia's pYIN is one alternative that performs probabilistic sequence estimation, but choosing Pitchy does not prevent adding our own offline smoothing and segmentation. [pYIN processing description](https://librosa.org/doc/0.10.2/generated/librosa.pyin.html).

`decodeAudioData()` decodes complete supported files and resamples to the audio context's sample rate; it is not an incremental decoder for arbitrary recording fragments. Recording formats and browser support must be checked if encoded recording is used. Direct sample capture can avoid an encode/decode round trip when only analysis is needed. [MDN: decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData).

Audio frequency cannot determine enharmonic spelling: the exercise context must decide whether a detected pitch is represented as, for example, C-sharp or D-flat.

## 3. Live pitch recognition

Use the same Pitchy detector on a rolling sample window. Live analysis needs additional attention to scheduling and feedback stability:

- Capture samples through Web Audio. An `AudioWorklet` provides processing on the audio rendering thread; keep work there bounded and use a worker for heavier analysis if needed.
- Preserve sample-based timestamps across processing and messaging. Message arrival time or a UI animation frame is not the time the learner produced the sound.
- Require enough signal and stability before presenting a confident pitch. Decide how quickly feedback should react to genuine note changes.
- Update the visual feedback at a useful display rate rather than on every audio block.
- Handle suspension, lost input, navigation, and cleanup explicitly.

At 48 kHz, a 2,048-sample window spans about 43 ms and a 4,096-sample window about 85 ms. These figures describe the audio window, **not total microphone-to-screen latency**. Lower notes need enough periods in a window; larger windows and additional stability checks trade responsiveness for robustness. Input buffering, scheduling, analysis, and rendering also contribute delay. [MDN: AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet), [MDN: using AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet).

Live feedback can be provisional. An exercise could analyze the captured attempt afterwards for its final grade, while using the rolling detector for guidance. Whether an exercise shows live tuning at all is a pedagogical decision: it can be a learning aid or reveal information that an assessment intends the learner to supply.

## Shared capture and timing requirements

Microphone access requires a secure context and user permission. The capture lifecycle needs explicit start/stop, permission-denied handling, device-loss handling, and release of microphone tracks when finished. [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

For analysis, request mono input and consider requesting that automatic gain control, noise suppression, and echo cancellation be disabled. Browsers and devices may not honor every preference; inspect actual track settings and validate the resulting signal. These processing features can alter attacks and pitch cues. The exact capture settings remain a testable choice, especially when playback occurs simultaneously. [MDN: MediaTrackSettings](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings).

Playback clock correction does not measure microphone or acoustic capture delay. The output timestamp API relates rendered output frames to the performance clock; microphone timing needs its own mapping and treatment of residual latency. The existing output correction must not be assumed to calibrate clap input. A user timing adjustment also includes human anticipation or reaction and cannot independently measure device latency. [MDN: getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp), [existing timing discussion](rhythm-exercises-plan.md#timing-on-slower-systems-and-optional-setup).

Distinguish unreliable capture or uncertain detection from a confidently recognized musical error. Technical interruptions should not become failed answers, and a low-confidence signal should not silently count as a wrong note.

## Backend and package ownership

The browser can perform short monophonic recording analysis, live pitch detection, and clap onset detection locally. A backend would add network delay and operational work without being necessary for the agreed scope. Keeping audio local also avoids requiring upload of microphone recordings.

A backend could become useful for separately requested storage, sharing, or heavier/longer offline processing. None is currently required by this investigation, and server round trips are a poor dependency for immediate live feedback.

Suggested ownership, still to be designed:

- The app owns permissions, capture lifecycle, presentation, exercise policy, and grading orchestration.
- Reusable detection and timestamp handling should sit behind a small audio-input/analysis interface; its owning package and API are not settled.
- `@polyhymnia/music-theory` remains responsible for musical pitch logic.
- Rhythm analysis should feed the rhythm timing contract through an input adapter. Review capture delay and delivery requirements before fitting microphone events into the keyboard/pointer contract.

The existing playback `Instrument` abstraction is not itself an input-analysis API. Any future integration needs to reconcile the repository's third-party audio rules and dependency pinning with the chosen input boundary. Choosing Pitchy here does not install it or change package dependencies.

## Decisions still needed before implementation

- First exercises and supported sources: singing, which solo instruments, or both; expected pitch range and device/browser matrix.
- Pitch rules: absolute note or pitch class, octave correctness, tuning reference, cents tolerance, minimum stable duration, and treatment of vibrato, slides, and attacks.
- Sequence rules: repeated-note segmentation, gaps/breaths, expected rhythm, and alignment of detected notes to targets.
- Rhythm input rules: accepted sounds, noise handling, duplicate rejection, simultaneous playback, and capture-delay treatment.
- UX: when to request microphone access, input-level guidance, uncertain-signal feedback, and whether live guidance is enabled during assessment.
- Whether recordings are retained at all; local analysis does not require retaining or uploading them.
- Actual accuracy and latency: validate representative voices/instruments, low notes, octave errors, quiet/noisy rooms, speakers/headphones, and desktop/mobile devices before committing thresholds or promises.

Implementation remains deferred. The settled technical choice from this discussion is Pitchy for monophonic pitch detection; browser-local processing and separate onset detection are the recommended starting architecture.
