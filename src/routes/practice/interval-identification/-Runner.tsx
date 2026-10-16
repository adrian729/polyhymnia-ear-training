import { useMemo } from 'react';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { intervalById, intervalIdDisplayName, type IntervalId } from '@polyhymnia/music-theory';
import { NotesReveal } from '@/components/presets/NotesReveal';
import { cn } from '@/lib/utils';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import { type AnsweredQuestion } from '@/exercises/shared';
import {
  buildQuestionEvents,
  EXERCISE_TITLE,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  withAnswer,
  type IdentificationOptions,
  type Question,
} from '@/exercises/interval-identification';

interface RunnerProps {
  options: IdentificationOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

function generate(options: IdentificationOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function isCorrect(question: Question, answer: IntervalId): boolean {
  return answer === question.size;
}

function verdict({ question, correct }: AnsweredQuestion<Question, IntervalId>): string {
  const correctName = intervalIdDisplayName(question.size);
  return correct ? `Correct: ${correctName}` : `Wrong: the answer was ${correctName}`;
}

function answerGridClass(count: number): string {
  if (count <= 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
  if (count === 5) return 'grid-cols-3 sm:grid-cols-5';
  return 'grid-cols-3 sm:grid-cols-4';
}

function IntervalSingle({ question }: { question: Question }) {
  return (
    <div className="flex w-full max-w-[46rem] flex-col items-center gap-1">
      <span className="text-body font-medium text-muted-foreground">{question.tones.name}</span>
      <RevealStaff>
        <NotesReveal
          pitches={[question.tones.from, question.tones.to]}
          clef={question.clef}
          mode={question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
        />
      </RevealStaff>
    </div>
  );
}

const REVEAL_PLACEHOLDER = (
  <div className="flex w-full max-w-[46rem] flex-col items-center gap-1">
    <span className="min-h-6" />
    <RevealStaff className="rounded-md bg-muted" />
  </div>
);

function AnswerGrid({
  question,
  selected,
  answered,
  disabled,
  answer,
  hear,
  intervals,
  events,
}: AnswerRenderProps<Question, IntervalId> & {
  intervals: readonly IntervalId[];
  events: (question: Question) => NoteEvent[];
}) {
  const correct = question.size;
  return (
    <div className={cn('grid gap-2 sm:gap-3', answerGridClass(intervals.length))}>
      {intervals.map((id) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          aria-label={answered ? `Hear ${intervalIdDisplayName(id)}` : undefined}
          onClick={() => (answered ? hear(events(withAnswer(question, id))) : answer(id))}
          className={cn(
            'flex h-16 items-center justify-center rounded-xl border-2 px-2 text-center text-meta font-semibold leading-tight sm:text-body',
            answerTileClass(answerTileState(id, correct, selected, answered)),
          )}
        >
          {intervalIdDisplayName(id)}
        </button>
      ))}
    </div>
  );
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  const sortedIntervals = useMemo(
    () => [...options.intervals].sort((a, b) => intervalById(a).semitones - intervalById(b).semitones),
    [options.intervals],
  );

  const events = (question: Question) => buildQuestionEvents(question, options.tempo);

  return (
    <LessonRunner<Question, IntervalId, IdentificationOptions>
      options={options}
      exerciseTitle={EXERCISE_TITLE}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={events}
      isCorrect={isCorrect}
      saveResult={recordLessonResult}
      prompt="Which interval did you hear?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} intervals={sortedIntervals} events={events} />}
      renderReveal={(question) => <IntervalSingle question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      summaryNote={(item) => ` — you answered ${intervalIdDisplayName(item.answer)}`}
    />
  );
}
