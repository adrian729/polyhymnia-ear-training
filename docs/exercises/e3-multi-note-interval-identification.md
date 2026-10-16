# E3 Multi-Note Interval Identification

Product spec for Polyhymnia's multi-note extension of interval identification. EarMaster has no such activity; it builds on EarMaster's Interval Identification (`docs/earmaster.md` E2) and E2 of this app (`docs/exercises/e2-interval-identification.md`), and is not EarMaster's E3 (Interval Singing). Tags: **[EM]** = matches documented EarMaster behaviour (source in `docs/earmaster.md` or the URL given); **[ours]** = EarMaster is undocumented here, so this is our decision.

Implementation: `src/exercises/multi-interval-identification/` (pure logic) and `src/routes/practice/multi-interval-identification/` (screens). Logic shared with E1, E2 and E4 lives in `src/exercises/shared/`. The reveal uses one new preset, `NotesReveal`, in `packages/notation-react`.

## Plays

- Three notes in the lessons; three, four or five in the custom exercise [ours]. The lowest note is the reference; every other note is named by its interval from it [ours].
- Ascending: the reference first, then the other notes upward. Descending: the top note first, the reference last. Harmonic: all notes together [ours].
- Random (custom only): the lowest note first, then the other notes one after another in a random order, reshuffled every question; the answer rows stay in pitch order from the lowest note [ours].
- Mixed: each question is uniformly ascending, descending or harmonic, the same meaning as in E1 and E2 [ours].
- Melodic: each note lasts one note length (tempo option), no gap between notes [ours, same as E1 and E2].
- Harmonic: all notes together for two note lengths [ours, same as E1 and E2].
- The question plays automatically when it appears. **Play question** replays it [EM: "Play Question"]. There is no automatic replay after answering [ours].

## Shows

- Before answering: the instruction "Name each note's interval above the lowest note.", one row of interval buttons per note above the reference, **Play question**, and in lessons the progress bar. No staff [EM: the staff only shows the tones after answering].
- The answer buttons are disabled until the question has started playing [ours, same as E1 and E2].
- Rows are in pitch order from the lowest note up, so the first row is the note just above the lowest and the last row is the top note, in every playing mode (the same order as the verdict and the staff labels). Labels avoid ordinals that would clash with interval names: three notes give "Middle note" and "Top note"; four or five notes give "Note 2", "Note 3", "Note 4", "Top note", where the lowest note is note 1 [ours].

## Answer

- All rows are answered first, then checked together [ours].
- Each row offers the enabled intervals as tiles with short labels (m3, P12, TT, A11) and the accessible label starting with the short label followed by the full name (`m3, minor 3rd`). The tiles sit in six columns, each column a semitone class, so m3 sits above m10 [ours].
- The answer is checked as soon as every row has a choice; there is no Check button. Until the last row is filled, earlier choices can still be changed [ours].
- One check per question; it is evaluated immediately [EM F15, applied to the whole question].
- Keyboard: `Space` plays the question; `Enter` goes to the next question once answered. No answer keys [ours, same as E2].
- Anything that ends the question (checking, **Finish** in endless mode, or leaving) stops the sound immediately; **Play question** can replay it afterwards [ours, same as E1 and E2].

## Options

Workshop lessons fix the options; the custom exercise exposes them [ours].

| Option            | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Tag                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Intervals         | Lessons: one of nine sets. Custom: the same interval picker as E1's custom exercise, with individual tiles for all 24 intervals (minor 2nd to double octave), the set chips Perfect, Imperfect consonant, Dissonant and All intervals, the Second octave chip and the Full names / Short toggle. Sets combine: a chip is on when all its intervals are ticked and toggles them together. Pick at least one interval fewer than the largest ticked number of notes (the notes above the lowest are all different). Default: the consonant core | ours                                                                |
| Notes             | Lessons: 3. Custom: 3 · 4 · 5, tick one or more; each question picks one of the ticked counts                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ours                                                                |
| Playing mode      | Lessons: ascending, descending, harmonic or mixed. Custom: any of the same, plus Random: the lowest note first, then the others one after another in random order (a fresh shuffle each question); the answer rows stay in pitch order                                                                                                                                                                                                                                                                                                        | ours (mixed as under Plays)                                         |
| Range             | Lessons: C3–C6 for sets 1–4, G2–C6 for sets 5–9. Custom: lowest and highest tone any question may use, as in E1 (default C3–C6 for the default intervals); the range must be wider than the largest ticked interval, all measured from the lowest note                                                                                                                                                                                                                                                                                                                                                                                                          | ours (replaces EarMaster's keys and root movement, as in E1 and E2) |
| Tempo             | Lessons: Medium (0.7 s note length). Custom: slow, medium, fast (1.0 s, 0.7 s, 0.45 s)                                                                                                                                                                                                                                                                                                                                                                                                                                                        | EM (shared tempo option), values ours                               |
| Questions         | Lessons: 10. Custom: same control as E1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ours                                                                |
| Auto new question | Lessons: on, after a correct answer (1.5 s, **Stay** cancels it, same mechanism as E1). Custom: off by default                                                                                                                                                                                                                                                                                                                                                                                                                                | EM F12, Stay ours                                                   |

The custom exercise screen explains every option inline, reusing the help text of the lessons. The last-used custom options are remembered in the browser (`localStorage`, key `polyhymnia:e3:customOptions`) and restored next time the page opens with no options chosen yet; a **Reset to defaults** button clears back to the defaults above [ours, same as E1].

## Question choice

- Mode: uniform among the enabled modes [ours, as E1 and E2].
- Notes: the number of notes is uniform among the ticked counts [ours].
- Intervals: the notes above the reference are distinct pitches, chosen without replacement from the set, all measured from the reference; octave doublings of a pitch class (P5 with P12) are allowed [ours].
- Reference: chosen so that the largest interval of the question fits the range, so the reference is always the lowest note whatever order the notes sound in [ours].
- The same combination of intervals is not asked twice in a row [ours].
- Clef: one staff for the whole question; bass if the midpoint of the lowest and highest tones is below C4 (MIDI 60), treble otherwise. The rule is shared with E1 and E2 [ours].
- Spelling: each note is spelled by its interval from the reference (letter distance plus quality). The reference spelling (e.g. C♯ or D♭) is chosen to minimise accidentals over the whole stack. The tritone is spelled A4 or d5, and A11 is spelled A11 or d12, whichever needs fewer accidentals. Double accidentals only when unavoidable [ours].
- Compound names are kept: a P12 is answered "Perfect 12th", not "Perfect 5th" [ours].

## Feedback and scoring

- Scoring is all-or-nothing per question: the question is right only if every row is right [ours].
- After checking, each row is marked right or wrong (green or red, success and destructive tokens) and shows the correct answer [ours].
- Reveal: one staff with the notes as a melodic line, one after another, even for harmonic questions. Under the staff, one HTML caption per note in staff order names its interval from the reference ("Lowest note" for the lowest). Interval names are HTML captions, not engine text [ours].
- Play question still works after answering. **Next question** (`Enter`) continues [EM behaviour, same as E1 and E2].
- Lesson score: right answers ÷ questions asked, as a percentage [EM F15].
- Progress bar and endless-run **Finish** button: same mechanics as E1 [EM F5, ours for Finish].
- Every finished session shows the score and a review of every question asked, each with a **Replay** button; lessons additionally show a passed/not passed badge [ours, same as E1 and E2].

## Levels

Workshop: 9 interval sets × 4 modes (ascending, descending, harmonic, mixed) = 36 lessons, plus the custom exercise [ours]. Lesson ids are `${set}-${mode}`; sets are `core`, `sixths`, `sevenths`, `simple`, `core-compound`, `thirteenths`, `fourteenths`, `compound`, `all`.

| #   | Set                           | Intervals               | What's new                               |
| --- | ----------------------------- | ----------------------- | ---------------------------------------- |
| 1   | Consonant core                | m3, M3, P4, P5, P8      | none                                     |
| 2   | Add the sixths                | + m6, M6                | the 6ths                                 |
| 3   | Add the sevenths              | + m7, M7                | the 7ths, so the octave stops being free |
| 4   | Add the seconds and tritone   | + m2, M2, TT            | all simple, 12                           |
| 5   | Consonant core, second octave | m10, M10, P11, P12, P15 | set 1 an octave up                       |
| 6   | Add the 13ths                 | + m13, M13              | the 13ths                                |
| 7   | Add the 14ths                 | + m14, M14              | so the compound octave stops being free  |
| 8   | Add the 9ths and the tritone  | + m9, M9, A11           | all compound, 12                         |
| 9   | All intervals                 | 1–8 combined            | 24                                       |

- Sets 1–4 and 5–8 are the same ladder twice: first octave, then the same intervals an octave higher. Set 9 is the union and is the only set that mixes simple and compound intervals in one question; its help text says so [ours].
- Module order is the table order [ours]. The two ladders are not equally hard: a 9th is a compound 2nd, so sets 5–7 are easier than set 4.
- Range per lesson: C3–C6 for sets 1–4, G2–C6 for sets 5–9 [ours, same as E2].
- Lesson rules [ours]: every lesson is three notes, asks exactly 10 questions, then shows the score, and is passed at 80% or more (used for the passed mark and the suggested next lesson). Four and five notes exist only in the custom exercise. Custom runs ask exactly the selected number, show the score and the per-question review, and are never graded.
- After the lesson, a summary shows the score, passed or not, and **Retake**, **Next lesson** (suggested when passed) and **Back to lessons** [EM F6], followed by a review of every question asked, each with a **Replay** button [ours, same as E1 and E2].
- The lesson list shows each lesson's best score and a passed mark, stored locally in the browser under `polyhymnia:e3:results`, independent of the other exercises' progress [EM F7, simplified].

## Notes

- The more notes, the harder. Three notes give two judgments and each note past three gives one more. The middle note is the hard one: the ear hears the stack as one sonority and the top note as "the top", not as an interval measured from the reference. Harmonic gets hardest the more notes are stacked. Descending is close to unusable past three notes, because the reference arrives last [ours].
- The octave is a real answer throughout. It only feels easy in set 1; from set 3 on, the ear has to reject a M7 below it and a m9 above it, and set 7 does the same job for the compound octave [ours].
- These are not chords: no quality is ever named, and any combination of pitches can appear. Answers will sometimes look like a chord spelled backwards (m3 + P5 is a major triad); that is harmless, since no quality is offered [ours].
- Because unisons and doubled pitches are never asked, the chromatic unison case in the engine (e.g. E♭4 and E4 drawn on the same spot) is a `notation-engine` bug that must be fixed for the reveal to draw correctly, not something to work around in the app.

## Not in this version

- Playing a tonic or a cadence before the question [EM, same as E2].
- Answering by entering tones on the staff, piano, fingerboard, MIDI or microphone; only multiple-choice buttons [EM].
- Per-row partial credit; a question is all or nothing [ours].
- Answering by chord quality, or any chord naming: see E4 [ours].
- Four- and five-note lessons in the workshop [ours].
- Keys and root movement; replaced by a plain pitch range [EM].
- Auditioning individual answer options, or replaying the question in a different mode after answering [ours, not asked for].
