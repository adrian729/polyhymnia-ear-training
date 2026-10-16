# E2 Interval Identification

Product spec for Polyhymnia's version of EarMaster's Interval Identification (`docs/earmaster.md` E2). Tags: **[EM]** = matches documented EarMaster behaviour (source in `docs/earmaster.md` or the URL given); **[ours]** = EarMaster is undocumented here, so this is our decision.

Implementation: `src/exercises/interval-identification/` (pure logic) and `src/routes/practice/interval-identification/` (screens). Shared logic with E1 lives in `src/exercises/shared/`. Nothing in `packages/*` changes.

## Plays

- One interval, ascending, descending or harmonic [EM].
- Melodic: each tone lasts one note length (tempo option), no gap between the two tones [ours, same as E1].
- Harmonic: both tones together for two note lengths [ours, same as E1].
- The question plays automatically when it appears. **Play question** replays it [EM: "Play Question"].

## Shows

- Before answering: the instruction "Which interval did you hear?", one button per enabled interval, **Play question**, and in lessons the progress bar. No staff [EM: the staff only shows the tones after answering].
- The answer buttons are disabled until the question has started playing [ours, same as E1].

## Answer

- Press the named button (mouse or touch) for the interval you heard [EM: multiple-choice buttons].
- One answer per question; it is evaluated immediately [EM F15].
- Keyboard: `Space` plays the question; `Enter` goes to the next question once answered. No answer keys [ours, same as E1 minus the A/S/B keys].
- Anything that ends the question (answering, **Finish** in endless mode, or leaving) stops the sound immediately; **Play question** can replay it afterwards [ours, same as E1].

## Options

Workshop lessons fix the options; the custom exercise exposes them [ours].

| Option | Values | Tag |
| --- | --- | --- |
| Intervals | Lessons: the interval family of the module. Custom: the same interval picker as E1's custom exercise, with individual tiles for all 24 intervals (minor 2nd to double octave), the set chips Perfect, Imperfect consonant, Dissonant and All intervals, the Second octave chip and the Full names / Short toggle. Pick at least two. Default: all 12 simple intervals | EM (lessons), ours (custom) |
| Playing mode | Lessons: asc, desc, harmonic, or mixed (random among all three, per question). Custom: tick any of ascending, descending, harmonic; each question picks one of the ticked | EM |
| Range | Lessons: C3–C6 for simple families, G2–C6 for compound. Custom: lowest and highest tone any question may use, as in E1 (default C3–C6 for the default intervals); the range must be wider than the largest ticked interval | ours (replaces EarMaster's keys and root movement, as in E1) |
| Tempo | Lessons: Medium (0.7 s note length). Custom: slow, medium, fast (1.0 s, 0.7 s, 0.45 s) | ours |
| Questions | Lessons: 10. Custom: same control as E1 | ours |
| Auto new question | Lessons: on, after a correct answer (1.5 s, **Stay** button cancels it, same mechanism as E1). Custom: off by default | EM F12, Stay ours |

The custom exercise screen explains every option inline. The last-used custom options are remembered in the browser (`localStorage`, key `polyhymnia:e2:customOptions`) and restored next time the page opens with no options chosen yet; a **Reset to defaults** button clears back to the defaults above [ours, same as E1 and E3].

## Question choice

- Mode: uniform among the lesson's enabled modes [EM].
- Size: uniform among the lesson's enabled intervals; sizes may repeat back to back, since repeating a size does not leak the answer the way repeating a comparison pair would in E1 [ours].
- Root: chosen so both tones fit the range for the sampled mode and size (ascending/harmonic: root anywhere from the low end up to `high − semitones`; descending: root from `low + semitones` up to the high end), spelled via the same preferred-spelling table as E1. The exact same question (mode, from, to) is avoided back to back [ours].
- Clef: per question, from the midpoint of the two tones: bass below C4, treble otherwise [ours, same rule as E1].

## Feedback and scoring

- After answering, the chosen button turns green if right or red if wrong; the correct button is always green [EM F16, same visual language as E1].
- The instruction line says "Correct: Major 3rd" or "Wrong: the answer was Major 3rd" [ours wording].
- Reveal: the interval on a single staff, labelled with its name and direction (e.g. "Major 3rd, ascending"). Clef as above [ours, same layout as E1's per-interval reveal].
- Play question still works after answering. **Next question** (`Enter`) continues [EM behaviour, same as E1].
- Question score: right or wrong. Lesson score: right answers ÷ questions asked, as a percentage [EM F15].
- Progress bar and endless-run **Finish** button: same mechanics as E1 [EM F5, ours for Finish].
- Every finished session shows the score and a review of every question asked, each with a **Replay** button; lessons additionally show a passed/not passed badge [ours, same as E1].

## Levels

Workshop: 5 interval families × 4 modes (ascending, descending, harmonic, mixed) = 20 lessons [EM S9-style structure, exact module boundaries ours].

| Family | Intervals |
| --- | --- |
| Perfect | P4, P5, P8 |
| Imperfect consonant | m3, M3, m6, M6 |
| Dissonant | m2, M2, TT, m7, M7 |
| All simple | m2 … P8 |
| Compound | m9 … P15 |

- Range per lesson: C3–C6 for simple families, G2–C6 for compound [ours, same as E1].
- Each lesson asks exactly 10 questions, then shows the score; it is passed at 80% or more [ours, same threshold as E1].
- After the lesson, a summary shows the score, passed or not, and **Retake**, **Next lesson** (suggested when passed) and **Back to lessons** [EM F6], followed by a review of every question asked, each with a **Replay** button [ours, same as E1].
- The lesson list shows each lesson's best score and a passed mark, stored locally in the browser under its own key, independent of E1's progress [EM F7, simplified].

## Not in this version

- Playing a tonic or a cadence before the question, for functional hearing [EM].
- Answering by entering tones on the staff, piano, fingerboard, solfege keyboard, MIDI or microphone; only multiple-choice buttons [EM].
- Answer identification modes (absolute, any octave, relative) [EM].
- Keys and root movement, and the advanced root-placement options; replaced by a plain pitch range, as in E1 [EM].
- Auditioning individual answer options before choosing, or replaying the question in a different mode after answering [ours, not asked for].
- EarMaster's own 16-module progression (m2/M2 pairs up to all intervals in an octave); this version reuses E1's 5-family split instead [EM S9].
