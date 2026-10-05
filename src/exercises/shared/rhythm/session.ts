import { timingAccuracy, type TimingAnalysis, type PulseMetadata } from '@polyhymnia/rhythm';

export const RHYTHM_PASS_PERCENT = 80;

export interface AttemptReview { id: string; bpm: number; task?: string; result: TimingAnalysis<PulseMetadata>; clockSource?: string; accuracy: number }
export interface TimingSession {
  id: string;
  limit: number | 'endless';
  completed: number;
  accuracyTotal: number;
  reviews: readonly AttemptReview[];
  lastAttemptId?: string;
  clockSources: readonly string[];
}
export function newTimingSession(limit: number | 'endless', id: string): TimingSession {
  if (limit !== 'endless' && (!Number.isInteger(limit) || limit < 1 || limit > 200)) throw new RangeError('Invalid session length.');
  return { id, limit, completed: 0, accuracyTotal: 0, reviews: [], clockSources: [] };
}
export const sessionComplete = (session: TimingSession) => session.limit !== 'endless' && session.completed === session.limit;
export const sessionAccuracy = (session: TimingSession) => session.completed ? session.accuracyTotal / session.completed : undefined;
export function completeTimingAttempt(session: TimingSession, attempt: Omit<AttemptReview, 'accuracy'>): TimingSession {
  if (sessionComplete(session) || session.lastAttemptId === attempt.id || session.reviews.some(r => r.id === attempt.id)) return session;
  const accuracy = timingAccuracy(attempt.result);
  return { ...session, completed: session.completed + 1, accuracyTotal: session.accuracyTotal + accuracy,
    lastAttemptId: attempt.id, reviews: [...session.reviews, { ...attempt, accuracy }].slice(session.limit === 'endless' ? -50 : -200),
    clockSources: attempt.clockSource ? [...new Set([...session.clockSources, attempt.clockSource])] : session.clockSources };
}
