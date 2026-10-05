# Starter rhythm exercises

Accepted on 2026-10-05 for an initial implementation. Keep the number of variations small; extend them after hands-on review.

## Shared behavior

- Reuse the interval exercises' lesson shell, navigation, progress stepper, answer styles, next-action placement and expanded end summaries.
- Presets have five attempts. Generate fresh patterns and BPMs between attempts, within hardcoded ranges. Pattern exercises start at 70–100 pulse BPM; the compound-metre identification lesson uses 60–90.
- Custom practice selects multiple compatible variations and metres, its own tempo range (40–180), and finite or endless attempts. Equal minimum/maximum means fixed tempo.
- Choice lessons pass at four correct answers out of five. Timed attempts pass at 80% on-time attacks divided by targets plus extra taps; the lesson passes at 80% average accuracy.
- Timed exercises share the existing Rhythm settings: tolerance, metronome volume/preview, short tap-feedback sound/volume/preview, and separate keyboard/pointer lag compensation (0–250 ms). Settings stay on the lessons page.
- Space and click/touch operate the same tap pad, with color and sound feedback. Count-in notes use the existing distinct intro color. Completed attempts hide the pad and place Next attempt above feedback.
- Timing measures note attacks, not held note lengths. Interrupted timed attempts restart with a count-in and do not consume an attempt or save a failure.
- Choice questions can be replayed before answering. After answering, compare the relevant sounds and scores; end summaries keep the existing expanded review.
- Listening-only questions start directly, without a count-in, and show playback status. Tapping exercises wait for Start on every attempt; Next attempt prepares the new example for inspection without starting it. Their count-ins establish the tempo before tapping (and orient the tap-back model, including leading rests).
- Use the existing MNX notation and music font. Scores and audio derive from the same pattern. No recordings or accompaniment catalogue are needed.

## Rhythm Tap-back

**Variants:** one bar of quarter notes and paired eighths in 2/4; the same vocabulary in 4/4; add quarter rests in 4/4.

**Hear/see/do:** one bar of count-in, a percussion model, a second count-in, then tap the model rhythm over a quiet metronome. The model score stays hidden until feedback. Only the count-in has moving notation.

**Answer/progression:** tap each attack, leaving rests empty. Progress through longer patterns and then rests. Extra taps, omissions and early/late attacks affect accuracy.

**Feedback:** the shared timing metrics/plot, correct score and highlighted playback. Mark missed or mistimed target notes in the score.

## Rhythm Recognition

**Variants:** 2/4 quarter/eighth patterns; 4/4 patterns; 4/4 patterns with quarter rests.

**Hear/see/do:** hear one percussion pattern without a count-in; choose among three written patterns. Playback status makes the start and end clear without identifying the correct score. Replay is available before answering.

**Answer/progression:** exactly one choice has the heard attacks. Distractors use the same vocabulary, metre and length, with audibly different attacks. Start with two beats, then four, then rests.

**Feedback:** existing correct/wrong answer colors and verdict; answer buttons replay their own patterns. Reveal the correct score with highlighted playback.

## Metre Identification

**Variants:** 2/4 versus 3/4; add 4/4; 3/4 versus 6/8.

**Hear/see/do:** hear a deliberately accented percussion pattern without notation; choose the metre. Simple metres use two subdivisions per pulse, 6/8 uses three per dotted-quarter pulse. Four-beat groups have a weaker middle accent.

**Answer/progression:** identify the grouping from accents and subdivisions. All choices use the same pulse tempo for comparison. Every example has twelve pulses, so total duration does not reveal the metre. These are clear teaching examples rather than ambiguous musical excerpts.

**Feedback:** standard choice feedback, a score showing the beat grouping, and playback retaining the original accents/subdivisions. Answer buttons play their metre at the question's BPM.

## Rhythm Reading

**Variants:** 2/4 quarter/eighth patterns; 4/4 patterns; add quarter rests in 4/4.

**Hear/see/do:** see the score before starting and throughout the attempt. Hear one bar of count-in, then tap the written attacks over a quiet metronome. Do not play the answer or animate expected note attacks during the response.

**Answer/progression:** the same attack/rest scoring as tap-back. Add pattern length, then rests.

**Feedback:** timing metrics/plot and correct-pattern playback with moving note highlighting; mark missed or mistimed notes.

## Rhythm Error Detection

**Variants:** two heard one-bar 4/4 patterns, Same/Different; a two-bar 4/4 score with exactly one changed bar; the same localization task with quarter rests.

**Hear/see/do:** heard comparisons start directly with A on a woodblock and B on a kick drum, separated by two pulses of silence (at least 1.2 seconds). Large illuminated A/B letters and a pause label follow the audio clock, including question replays in the end summary. Sound identity is consistent for Same and Different examples and in answer replays. Score comparisons show the written original and play an altered performance without a count-in, labeling the current bar without revealing the changed attacks. Choose Same/Different or Bar 1/Bar 2, respectively.

**Answer rules:** derive both patterns from one base. Preserve metre, total duration, tempo and vocabulary. Heard examples are independently Same/Different with equal probabilities; a different example changes two distinct beats. Localization examples change one beat in exactly one bar. Quarter/eighth substitutions and rest changes alter actual attacks, rather than notation spelling alone.

**Similarity/difficulty:** more similar pairs make Same/Different harder. Do not carry that rule over automatically to localization: finding the changed bar is a separate skill. The starter localization tasks use an obvious controlled edit and add rests later. Advanced subtle changes or exact-difference answers are deferred.

**Feedback:** standard verdict/choice colors, original and performed scores, and separate playback. Highlight the changed beats using each score's own event IDs, including rests. Bar buttons compare that written bar with its performed counterpart using the same distinct sounds, pause and large A/B cues labeled Written/Performed.

## Silent-bar Timing

**Variants:** one silent bar in 4/4; one silent bar in 3/4; two silent bars in 4/4.

**Hear/see/do:** after one bar of count-in, tap continuously for four response bars. One-silent-bar variants play two audible bars, one silent bar, then one returning bar. The two-silent-bar variant plays one audible bar, two silent bars, then one returning bar. No moving response guide, including during silence.

**Answer/progression:** grade only the silent pulses and the first returning pulse. Audible lead-in taps are practice. Extend silence only after learning to maintain one bar.

**Feedback:** shared timing metrics/plot plus the first returning beat's signed early/late error, or a missed indication.

## Implementation boundaries

This rollout changes the app only. `src/exercises/rhythm-practice/` owns the variant catalogue, custom options, pattern generation, MNX construction and exercise-specific plans/audio events. Thin file routes expose the six exercise pages.

`PracticePages` reuses `WorkshopPage`, `CustomFrame` and the existing option cards. Choice adapters use `LessonRunner`; its audio factory, prompt and keyboard mapping accept exercise adapters while interval defaults remain unchanged. Timed adapters and Pulse tapping share `TimedPracticeRunner`, with exercise-specific prompts, guide and review content.

The current public `@polyhymnia/rhythm` APIs own plans, matching and statistics; `@polyhymnia/rhythm/browser` owns timestamp capture, input binding and interruptions; `@polyhymnia/rhythm-react` owns the controller hook and timing plot. Existing `@polyhymnia/web-audio` percussion/scheduling and `@polyhymnia/notation-react` rendering supply audio and notation. No new package capability or dependency is required.

Later candidates such as dictation, syncopation, triplets/sixteenths and exact-difference answers need their own specifications; they are outside these starter lessons.
