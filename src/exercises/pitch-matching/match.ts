import { createSampleHold, type PitchObservation } from '@polyhymnia/audio-analysis';
import { centsBetweenFrequencies, formatPitch, frequencyToMidi, midiToFrequency, midiToPitch } from '@polyhymnia/music-theory';

export const noteName = (midi: number) => formatPitch(midiToPitch(midi));
export const MATCH_CENTS = 50;
export const MATCH_SECONDS = .5;

export interface PitchHoldStatistics {
  seconds: number;
  minimumHz: number;
  maximumHz: number;
  averageHz: number;
}

export function describePitch(observation: PitchObservation, targetMidi: number) {
  if (observation.status !== 'pitched' || !observation.frequencyHz) return undefined;
  return { note: noteName(Math.round(frequencyToMidi(observation.frequencyHz))),
    frequencyHz: observation.frequencyHz,
    cents: centsBetweenFrequencies(observation.frequencyHz, midiToFrequency(targetMidi)) };
}

/** App exercise policy; sample coverage and pitch measurements are package contracts. */
export function createPitchMatch(targetMidi: number, sampleRate: number, startFrame: number, generation: string,
  criteria = { cents: MATCH_CENTS, seconds: MATCH_SECONDS }) {
  const hold = createSampleHold({ sampleRate, startFrame, generation });
  const requiredFrames = Math.ceil(criteria.seconds * sampleRate);
  let lastEnd: number | undefined;
  let frames = 0, weightedHz = 0, minimumHz = Infinity, maximumHz = -Infinity;
  const resetStatistics = () => {
    lastEnd = undefined; frames = 0; weightedHz = 0; minimumHz = Infinity; maximumHz = -Infinity;
  };
  const statistics = (): PitchHoldStatistics | undefined => frames < requiredFrames ? undefined : {
    seconds: requiredFrames / sampleRate, minimumHz, maximumHz, averageHz: weightedHz / frames,
  };
  return {
    reset() { hold.reset(); resetStatistics(); },
    observe(observation: PitchObservation, sourceGeneration: string) {
      // Foreign answers do not contribute measurements or break the current hold.
      if (sourceGeneration !== generation) return { seconds: hold.seconds, matched: hold.seconds >= criteria.seconds, statistics: statistics() };
      const pitch = describePitch(observation, targetMidi);
      const qualifies = !!pitch && observation.stable && Math.abs(pitch.cents) <= criteria.cents;
      const previousSeconds = hold.seconds;
      const seconds = hold.observe(observation, qualifies, sourceGeneration);
      if (!seconds) resetStatistics();
      else if (qualifies && (seconds > previousSeconds || (lastEnd !== undefined && observation.startFrame > lastEnd))) {
        if (lastEnd !== undefined && observation.startFrame > lastEnd) resetStatistics();
        // Overlapping analysis windows count only their new coverage. Clip the
        // last contribution at the required hold, rather than including overshoot.
        const newFrames = Math.min(requiredFrames - frames, observation.endFrame - (lastEnd ?? observation.startFrame));
        if (newFrames > 0) {
          frames += newFrames; weightedHz += pitch.frequencyHz * newFrames;
          minimumHz = Math.min(minimumHz, pitch.frequencyHz); maximumHz = Math.max(maximumHz, pitch.frequencyHz);
        }
        lastEnd = observation.endFrame;
      }
      return { seconds, matched: seconds >= criteria.seconds, statistics: statistics() };
    },
  };
}
