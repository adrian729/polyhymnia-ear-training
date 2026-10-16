# E4 Chord Identification

Product spec for Polyhymnia's version of EarMaster's Chord Identification (`docs/earmaster.md` E4). Tags: **[EM]** = matches documented EarMaster behaviour (source in `docs/earmaster.md` or the URL given); **[ours]** = EarMaster is undocumented here, so this is our decision.

Implementation: `src/exercises/chord-identification/` (pure logic, including the chord quality table) and `src/routes/practice/chord-identification/` (screens). Logic shared with E1–E3 lives in `src/exercises/shared/`. The reveal uses one new preset, `NotesReveal`, in `packages/notation-react`.

## Plays

- One chord in root position, close voicing, no doublings; every chord tone is inside C3–C6 [ours; EarMaster offers open and closed voicings, here root position only].
- Arpeggio: one tone at a time, one note length per tone (tempo option), no gap. Ascending goes from the root up; descending goes from the top tone down to the root. Descending is never an inversion: the root is still the lowest tone [ours].
- Harmonic: all tones together for two note lengths. A harmonic execution has no direction [ours].
- Arpeggio, then harmonic: the arpeggio, then one note length of silence, then all tones together [ours].
- The question plays automatically when it appears. **Play question** replays it [EM: "Play Question"]. There is no automatic replay after answering [ours].

## Shows

- Before answering: the instruction "Which chord did you hear?", one button per enabled chord, **Play question**, and in lessons the progress bar. No staff [EM: buttons, staff shown only after answering].
- The answer buttons are disabled until the question has started playing [ours, same as E1–E3].
- Answer labels give the full name with the symbol smaller, and name the quality only; the root is different every time and gives no clue [ours]. The chords and their labels:

| Chord   | Label                        |
| ------- | ---------------------------- |
| maj     | Major · maj                  |
| min     | Minor · m                    |
| dim     | Diminished · dim             |
| aug     | Augmented · aug              |
| sus2    | Suspended 2nd · sus2         |
| sus4    | Suspended 4th · sus4         |
| 6       | Major 6th · 6                |
| m6      | Minor 6th · m6               |
| 7       | Dominant 7th · 7             |
| maj7    | Major 7th · maj7             |
| m7      | Minor 7th · m7               |
| m(maj7) | Minor-major 7th · m(maj7)    |
| m7♭5    | Half-diminished 7th · m7♭5   |
| dim7    | Diminished 7th · dim7        |
| maj7♯5  | Augmented major 7th · maj7♯5 |

## Answer

- Press the named button (mouse or touch) for the chord you heard [EM: chord name on multiple-choice buttons].
- One answer per question; it is evaluated immediately [EM F15].
- Keyboard: `Space` plays the question; `Enter` goes to the next question once answered. No answer keys [ours, same as E2].
- Anything that ends the question (answering, **Finish** in endless mode, or leaving) stops the sound immediately; **Play question** can replay it afterwards [ours, same as E1–E3].

## Options

Workshop lessons fix the options; the custom exercise exposes them [EM: chord-type set, execution, direction].

| Option            | Values                                                                                                                                                                        | Tag                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Chords            | Lessons: the chord set of the module. Custom: set chips plus individual chord toggles, at least two chords                                                                    | EM (chord-type set), picker ours                    |
| Execution         | Lessons: see Levels. Custom: arpeggio · arpeggio, then harmonic · harmonic, tick one or more (at least one)                                                                   | EM (execution setting), values ours                 |
| Direction         | Custom: ascending · descending, tick one or both. Disabled and ignored when only Harmonic is ticked; at least one required when a non-harmonic execution is ticked            | EM (playback variations), rules ours                |
| Range             | Lessons: all chord tones within C3–C6. Custom: lowest and highest tone any chord tone may use, as in E1 (default C3–C6); the range must be wider than the widest ticked chord | ours (replaces EarMaster's keys and root placement) |
| Tempo             | Lessons: Medium (0.7 s note length). Custom: slow, medium, fast (1.0 s, 0.7 s, 0.45 s)                                                                                        | EM (shared tempo option), values ours               |
| Questions         | Lessons: 10. Custom: same control as E1                                                                                                                                       | ours                                                |
| Auto new question | Lessons: on, after a correct answer (1.5 s, **Stay** cancels it, same mechanism as E1). Custom: off by default                                                                | EM F12, Stay ours                                   |

The custom exercise screen explains every option inline, reusing the help text of the lessons. Chords are picked one by one or with chord sets that add or remove their whole group, so sets combine, like the interval picker of E1. Arpeggio alone exists only in the custom exercise; it is the hardest execution and nothing in the workshop drills it [ours]. The last-used custom options are remembered in the browser (`localStorage`, key `polyhymnia:e4:customOptions`) and restored next time the page opens with no options chosen yet; a **Reset to defaults** button clears back to the defaults above [ours, same as E1].

## Question choice

- Playback: uniform among the lesson's playbacks; in the Mixed lessons, uniform over ascending, descending and harmonic [ours].
- Chord: uniform among the enabled chords [ours].
- Root: chosen so every chord tone fits C3–C6 [ours].
- The same chord, root and playback are not asked twice in a row [ours].
- Clef: one staff; bass if the midpoint of the lowest and highest tones is below C4 (MIDI 60), treble otherwise. The rule is shared with E1–E3 [ours].
- Spelling: chords are spelled as stacked thirds from the root, so C dim7 is C E♭ G♭ B♭♭ and C maj7♯5 has G♯. Double accidentals only when unavoidable. The root spelling (e.g. C♯ or D♭) is chosen to minimise accidentals over the chord [ours].

## Feedback and scoring

- After answering, the chosen button turns green if right or red if wrong; the correct button is always green [EM F16, same visual language as E2].
- The instruction line says "Correct" or "Wrong" with the chord's full name [ours wording, as E2].
- Reveal: the chord on a single staff as stacked notes, whatever the playback. A caption in the style "C major — C E G" names the chord and its tones; the root is named only here. Captions are HTML, not engine text [ours].
- Play question still works after answering. **Next question** (`Enter`) continues [EM behaviour, same as E1–E3].
- Question score: right or wrong. Lesson score: right answers ÷ questions asked, as a percentage [EM F15].
- Progress bar and endless-run **Finish** button: same mechanics as E1 [EM F5, ours for Finish].
- Every finished session shows the score and a review of every question asked, each with a **Replay** button; lessons additionally show a passed/not passed badge [ours, same as E1–E3].

## Levels

Workshop: 9 chord sets × 4 playbacks = 36 lessons, plus the custom exercise [ours; EarMaster has 22 General Workshop modules and 22 Jazz lessons, EM S9]. Lesson ids are `${set}-${playback}` with playback `asc`, `desc`, `harmonic` or `mixed`; sets are `major-minor`, `dim-aug`, `triads`, `sus-added`, `dom-maj7`, `min-minmaj7`, `half-dim-dim7`, `sevenths`, `all`.

| Set                                     | Chords                                   |
| --------------------------------------- | ---------------------------------------- |
| Major and minor triads                  | maj, min                                 |
| Diminished and augmented triads         | dim, aug                                 |
| All triads                              | maj, min, dim, aug                       |
| Suspended and added-tone chords         | sus2, sus4, 6, m6                        |
| Dominant and major sevenths             | 7, maj7                                  |
| Minor and minor-major sevenths          | m7, m(maj7)                              |
| Half-diminished and diminished sevenths | m7♭5, dim7                               |
| All sevenths                            | 7, maj7, m7, m(maj7), m7♭5, dim7, maj7♯5 |
| All chords                              | everything above                         |

Playbacks (four per set):

| Playback   | Meaning                                                   |
| ---------- | --------------------------------------------------------- |
| Ascending  | `arp-harmonic-asc`, id suffix `asc`                       |
| Descending | `arp-harmonic-desc`, id suffix `desc`                     |
| Harmonic   | `harmonic`, id suffix `harmonic`                          |
| Mixed      | uniform over the three above per question, suffix `mixed` |

- Order of drills: one contrastive pair at a time first (maj/min, dim/aug, 7/maj7, m7/m(maj7), m7♭5/dim7), then the full set once the pair members can be told apart. Triads before sevenths, sus and added tones before sevenths, all sevenths and all chords last [ours].
- The playbacks are two steps, easy to hard. The arpeggio then harmonic lets the harmonic confirm what the arpeggio suggested; the harmonic alone has to be recognised without the arpeggio to lean on. Mixed closes every chord set [ours].
- Range per lesson: all tones within C3–C6 [ours].
- Lesson rules [ours]: a lesson asks exactly 10 questions, then shows the score, and is passed at 80% or more (used for the passed mark and the suggested next lesson). Custom runs ask exactly the selected number, show the score and the per-question review, and are never graded.
- After the lesson, a summary shows the score, passed or not, and **Retake**, **Next lesson** (suggested when passed) and **Back to lessons** [EM F6], followed by a review of every question asked, each with a **Replay** button [ours, same as E1–E3].
- The lesson list shows each lesson's best score and a passed mark, stored locally in the browser under `polyhymnia:e4:results`, independent of the other exercises' progress [EM F7, simplified].

## Notes

- Descending is never an inversion. C major played G4→E4→C4 still has the root lowest, so it is still root position. Descending is harder, since the chord is built upside down and on a seventh chord the 7th arrives first instead of last [ours].
- The engine bug where chromatic unisons in a chord (C–E♭–E: E♭4 and E4) draw on the same spot with no diagnostic is fixed in `notation-engine`, not worked around in the app.

## Not in this version

- Playing a tonic or a cadence before the question [EM].
- Answering by entering tones on the staff, piano, fingerboard, MIDI or microphone; only multiple-choice buttons [EM].
- Inversions, open voicings and custom voicings; root position, close voicing only [EM: voicing option].
- User-defined chords, and EarMaster's Jazz lessons (four-note chords by dissonance, 5–7 note chords derived from scales) [EM S13, S9].
- Keys and root placement options; replaced by a plain pitch range [EM].
- Arpeggio alone in the workshop; it exists only in the custom exercise [ours].
- Auditioning individual answer options, or replaying the question in a different playback after answering [ours, not asked for].
