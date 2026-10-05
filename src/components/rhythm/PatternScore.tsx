import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { Playback } from '@polyhymnia/web-audio/webaudio';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { LessonActionButton } from '@/components/lesson/LessonFrame';
import { attacks, patternEvents, patternScore, type Pattern } from '@/exercises/rhythm-practice/generator';
import { createPracticeSound } from '@/lib/rhythmSound';

const ONE_BAR_OPTIONS = { widthSp: 48, maxLastSystemFill: 1 };
const TWO_BAR_OPTIONS = { widthSp: 65, maxLastSystemFill: 1 };

export function PatternScore({ pattern, time, highlightIds = [], label = 'Rhythm score' }: { pattern: Pattern; time?: number; highlightIds?: readonly string[]; label?: string }) {
  const score = useMemo(() => patternScore(pattern), [pattern]);
  const positions = useMemo(() => attacks(pattern), [pattern]);
  const active = time === undefined ? undefined : positions.find(a => time >= a.atPulse && time < a.atPulse + a.durationPulse);
  const view = useMemo(() => ({ mode: 'notes' as const, activeIds: active ? [active.id] : [...highlightIds] }), [active, highlightIds]);
  return <div role="img" aria-label={label} className="w-full min-w-0">
    <Notation score={score} options={pattern.bars.length === 1 ? ONE_BAR_OPTIONS : TWO_BAR_OPTIONS} className="w-full"
      style={{ '--pn-playing': 'var(--primary-strong)' } as CSSProperties}><Notation.Playback view={view} /></Notation>
  </div>;
}
/** Answer playback includes score highlighting and stops when its review closes. */
export function PatternReplay({ pattern, bpm, label = 'Play rhythm', highlightIds, events, voice = 'a' }: { pattern: Pattern; bpm: number; label?: string; highlightIds?: readonly string[]; events?: readonly NoteEvent[]; voice?: 'a' | 'b' }) {
  const [sound] = useState(createPracticeSound);
  const [time, setTime] = useState<number>();
  const playback = useRef<Playback | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  useEffect(() => () => { sound.stop(); if (frame.current) cancelAnimationFrame(frame.current); }, [sound]);
  const play = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    const handle = sound.playEvents(events ?? patternEvents(pattern, bpm, 0, voice)); playback.current = handle;
    const tick = () => { const pulseTime = handle.time() * bpm / 60; setTime(events ? pulseTime % (pattern.metre === '6/8' ? 2 : Number(pattern.metre[0])) : pulseTime); frame.current = requestAnimationFrame(tick); };
    tick();
    void handle.finished.then(() => { if (playback.current !== handle) return; if (frame.current) cancelAnimationFrame(frame.current); setTime(undefined); });
  };
  return <div className="flex w-full min-w-0 flex-col items-center gap-tight"><PatternScore pattern={pattern} time={time} highlightIds={highlightIds} />
    <LessonActionButton variant="outline" onClick={play}>{label}</LessonActionButton></div>;
}
