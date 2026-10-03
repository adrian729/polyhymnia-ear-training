import { useMemo } from 'react';
import type { JSX } from 'react';
import type { NoteValue } from '@polyhymnia/mnx';
import { layoutScore } from '@polyhymnia/notation-engine';
import type { ClefSpec, LayoutResult, NotationOptions } from '@polyhymnia/notation-engine';
import { Notation } from '@polyhymnia/notation-react';
import { durationKey, fittingMeter } from '@/components/presets/shared';
import type { RevealBaseProps } from '@/components/presets/shared';
import { buildMeasureScore, chordEvent, noteEvent } from '@/components/presets/mnxBuild';

const QUARTER: NoteValue = { base: 'quarter' };
const NATURAL_WIDTH: NotationOptions = { widthSp: 1 };
const FULL_WIDTH_SP = 65;
const SLOT_SP = 12;

export interface NotesRevealProps extends RevealBaseProps {
  pitches: readonly string[];
  mode: 'melodic' | 'harmonic';
  clef: ClefSpec['kind'];
  duration?: NoteValue;
  labels?: readonly string[];
}

export function NotesReveal({
  pitches,
  mode,
  clef,
  duration = QUARTER,
  glyphStyle,
  labels,
  className,
  style,
  onLayout,
}: NotesRevealProps): JSX.Element {
  const { doc, eventCount } = useMemo(() => {
    const harmonic = mode === 'harmonic';
    const events = harmonic ? [chordEvent(pitches, duration)] : pitches.map((pitch) => noteEvent(pitch, duration));
    return { doc: buildMeasureScore(clef, fittingMeter(duration, events.length), events), eventCount: events.length };
  }, [pitches.join(' '), mode, clef, durationKey(duration)]);

  const { options, layout } = useMemo(() => {
    const natural = layoutScore(doc, NATURAL_WIDTH).viewBox.w;
    const fitted: NotationOptions = {
      widthSp: natural + SLOT_SP * eventCount,
      maxLastSystemFill: 1,
      style: glyphStyle,
    };
    return { options: fitted, layout: layoutScore(doc, fitted) };
  }, [doc, eventCount, glyphStyle]);
  const centred = { width: `${(layout.viewBox.w / FULL_WIDTH_SP) * 100}%`, marginInline: 'auto', ...style };

  if (!labels) {
    return <Notation score={doc} options={options} className={className} style={centred} onLayout={onLayout} />;
  }

  const slot = (SLOT_SP / layout.viewBox.w) * 100;
  const centers = eventCenters(layout, slot);
  return (
    <div className={className ? `pn-labelled ${className}` : 'pn-labelled'} style={centred}>
      <Notation score={doc} options={options} onLayout={onLayout} />
      <div className="pn-labels">
        {centers.slice(0, labels.length).map((center, i) => (
          <span key={i} className="pn-label" style={{ left: `${center}%`, width: `${slot}%` }}>
            {labels[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

function eventCenters(layout: LayoutResult, slot: number): number[] {
  const events = new Map<string, { tick: number; left: number; right: number }>();
  for (const box of Object.values(layout.elements)) {
    if (!box.eventId || !['note', 'chord', 'grace'].includes(box.kind)) continue;
    const seen = events.get(box.eventId);
    events.set(box.eventId, {
      tick: box.tick,
      left: Math.min(seen?.left ?? Infinity, box.x),
      right: Math.max(seen?.right ?? -Infinity, box.x + box.w),
    });
  }
  const { x, w } = layout.viewBox;
  return [...events.values()]
    .sort((a, b) => a.tick - b.tick)
    .map((event) => {
      const percent = (((event.left + event.right) / 2 - x) / w) * 100;
      return Math.min(100 - slot / 2, Math.max(slot / 2, percent));
    });
}
