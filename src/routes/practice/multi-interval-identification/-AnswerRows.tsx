import { useMemo, useState } from 'react';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { intervalById, intervalIdDisplayName, type IntervalId } from '@polyhymnia/music-theory';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import { withAnswer, type Question } from '@/exercises/multi-interval-identification';
import type { AnswerRenderProps } from '@/components/lesson/LessonRunner';

const COLUMNS = 6;

function rowLabel(index: number, rowCount: number): string {
  if (index === rowCount - 1) return 'Top note';
  return rowCount === 2 ? 'Middle note' : `Note ${index + 2}`;
}

function gridPlacement(intervals: readonly IntervalId[]): Map<IntervalId, { row: number; column: number }> {
  const bandOf = (id: IntervalId) => Math.floor((intervalById(id).semitones - 1) / COLUMNS);
  const bands = [...new Set(intervals.map(bandOf))].sort((a, b) => a - b);
  return new Map(
    intervals.map((id) => [
      id,
      {
        row: bands.indexOf(bandOf(id)) + 1,
        column: ((intervalById(id).semitones - 1) % COLUMNS) + 1,
      },
    ]),
  );
}

export function AnswerRows({
  question,
  selected,
  answered,
  disabled,
  answer,
  hear,
  intervals,
  events,
}: AnswerRenderProps<Question, readonly IntervalId[]> & {
  intervals: readonly IntervalId[];
  events: (question: Question) => NoteEvent[];
}) {
  const [draft, setDraft] = useState<readonly (IntervalId | undefined)[]>([]);
  const placement = useMemo(() => gridPlacement(intervals), [intervals]);
  const rowCount = question.rows.length;
  const chosen = answered ? (selected ?? []) : draft;
  const choose = (index: number, id: IntervalId) => {
    if (answered) return hear(events(withAnswer(question, index, id)));
    const next = Array.from({ length: rowCount }, (_, i) => (i === index ? id : draft[i]));
    setDraft(next);
    if (next.every((choice) => choice !== undefined)) answer(next as readonly IntervalId[]);
  };

  return (
    <div className="flex flex-col gap-5">
      {question.rows.map((row, index) => {
        const choice = chosen[index];
        const right = answered && choice === row.size;
        return (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex h-6 items-center justify-between text-meta">
              <span className="font-medium">{rowLabel(index, rowCount)}</span>
              {answered && (
                <span
                  className={cn(
                    'flex items-center gap-1 font-medium',
                    right ? 'text-success-strong' : 'text-destructive',
                  )}
                >
                  {right ? <Check className="size-4" /> : <X className="size-4" />}
                  {right ? 'Correct' : `Wrong, it was ${row.size}`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5" role="group" aria-label={rowLabel(index, rowCount)}>
              {intervals.map((id) => {
                const cell = placement.get(id)!;
                const state = answerTileState(id, row.size, choice ?? null, answered);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={disabled}
                    aria-label={`${answered ? 'Hear ' : ''}${id}, ${intervalIdDisplayName(id).toLowerCase()}`}
                    aria-pressed={choice === id}
                    onClick={() => choose(index, id)}
                    style={{ gridRow: cell.row, gridColumn: cell.column }}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-lg border-2 px-1 text-meta font-semibold sm:h-11',
                      answerTileClass(state),
                      !answered && choice === id && 'border-primary-strong bg-primary/15 text-primary-strong',
                    )}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
