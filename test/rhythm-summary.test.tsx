import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyzeTiming } from '@polyhymnia/rhythm';
import { generatePulse } from '@/exercises/pulse-tapping/generator';
import { DEFAULT_OPTIONS } from '@/exercises/pulse-tapping/options';
import { completeTimingAttempt, newTimingSession } from '@/exercises/shared/rhythm/session';
import { TimingSummary } from '@/components/rhythm/TimingSummary';
import { PulseScore } from '@/components/rhythm/PulseScore';
import { NotesReveal } from '@/components/presets/NotesReveal';

it('renders the rhythm score with the same shared music font as existing exercise scores', () => {
  const existing = renderToStaticMarkup(<NotesReveal pitches={['B4']} mode="melodic" clef="treble" />);
  const rhythm = renderToStaticMarkup(<PulseScore plan={generatePulse(DEFAULT_OPTIONS)} metre="4/4"
    phase="respond" playbackTimeSeconds={0} playing={false} />);
  const musicFont = (html: string) => html.match(/data-pn="glyphs"[^>]*font-family="([^"]+)"/)?.[1];
  expect(musicFont(existing)).toBeTruthy();
  expect(musicFont(rhythm)).toBe(musicFont(existing));
});

it('keeps rhythm summary reviews expanded with every timing metric, without grading custom practice', () => {
  const plan = generatePulse(DEFAULT_OPTIONS);
  const result = analyzeTiming(plan, plan.targets.map((target, sequence) => ({
    atSeconds: target.atSeconds + 0.02 + sequence * 0.002, sequence,
  })), 0.08);
  const session = completeTimingAttempt(newTimingSession(1, 'summary'), { id: 'attempt', bpm: plan.pulseBpm, result });
  const html = renderToStaticMarkup(<TimingSummary session={session} graded={false}><button>Retake</button></TimingSummary>);
  expect(html).not.toContain('<details');
  expect(html).toContain('<article');
  expect(html).toContain('16 on time');
  expect(html).toContain('Median: 35 ms late');
  expect(html).toContain('Median absolute error: 35 ms');
  expect(html).toContain('Drift:');
  expect(html).toContain('role="img"');
  expect(html).not.toContain('Passed');
  expect(html).not.toContain('Not passed');
  expect(html.indexOf('Retake')).toBeLessThan(html.indexOf('<article'));
  expect(renderToStaticMarkup(<TimingSummary session={session} graded><button>Retake</button></TimingSummary>)).toContain('Passed');
});
