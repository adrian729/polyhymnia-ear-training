import { NotesReveal } from '@/components/presets/NotesReveal';
import { cn } from '@/lib/utils';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner, type AnswerRenderProps } from '@/components/lesson/LessonRunner';
import { answerTileClass, answerTileState } from '@/components/lesson/answerTiles';
import { Initial } from '@/components/Initial';
import { OrnamentCorners } from '@/components/Ornament';
import type { AnsweredQuestion, Tempo } from '@/exercises/shared';
import {
  buildQuestionEvents,
  choiceEvents,
  EXERCISE_TITLE,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type Answer,
  type ExerciseOptions,
  type Question,
} from '@/exercises/interval-comparison';

const INITIAL_TONE: Record<'idle' | 'correct' | 'wrong' | 'other', string> = {
  idle: '[--initial-letter:var(--foreground)] [--initial-frame:var(--rubric)]',
  correct: '[--initial-letter:var(--success-strong)] [--initial-frame:var(--success)]',
  wrong: '[--initial-letter:var(--destructive)] [--initial-frame:var(--destructive)]',
  other: '[--initial-letter:var(--muted-foreground)] [--initial-frame:var(--border)]',
};

interface RunnerProps {
  options: ExerciseOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

function generate(options: ExerciseOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function isCorrect(question: Question, answer: Answer): boolean {
  return answer === question.correct;
}

function verdict({ question, correct }: AnsweredQuestion<Question, Answer>): string {
  const correctText = question.correct === 'same' ? 'A and B were the same size' : `${question.correct} was larger`;
  return correct ? `Correct: ${correctText}` : `Wrong: ${correctText}`;
}

const ANSWER_KEYS: Record<string, Answer> = { a: 'A', b: 'B', s: 'same' };

function IntervalPair({ question }: { question: Question }) {
  return (
    <div className="flex w-full flex-col divide-y divide-border border-y border-border">
      {(['a', 'b'] as const).map((key) => {
        const tone = question[key];
        return (
          <div key={key} className="flex w-full items-baseline gap-base py-tight">
            <span aria-hidden="true" className="shrink-0 font-display text-heading">
              {key.toUpperCase()}
            </span>
            <div className="flex w-full max-w-[46rem] flex-col gap-tight">
              <span className="rubricated font-specimen text-meta text-muted-foreground">{tone.name}</span>
              <RevealStaff>
                <NotesReveal
                  pitches={[tone.from, tone.to]}
                  clef={question.clef}
                  mode={question.mode === 'harmonic' ? 'harmonic' : 'melodic'}
                />
              </RevealStaff>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const REVEAL_PLACEHOLDER = (
  <div aria-hidden="true" className="flex w-full flex-col divide-y divide-border border-y border-border">
    {(['A', 'B'] as const).map((letter) => (
      <div key={letter} className="flex w-full items-baseline gap-base py-tight">
        <span className="shrink-0 font-display text-heading text-transparent">{letter}</span>
        <div className="flex w-full max-w-[46rem] flex-col gap-tight">
          <span className="rubricated font-specimen text-meta text-transparent">Placeholder</span>
          <RevealStaff className="rounded-lg border border-border bg-surface-sunken" />
        </div>
      </div>
    ))}
  </div>
);

const HEAR_LABEL: Record<Answer, string> = { A: 'Hear A', B: 'Hear B', same: 'Hear both' };

function AnswerGrid({
  question,
  selected,
  answered,
  disabled,
  answer,
  hear,
  tempo,
}: AnswerRenderProps<Question, Answer> & { tempo: Tempo }) {
  const correct = question.correct;
  return (
    <div className="mx-auto grid w-full max-w-xl grid-cols-3 items-stretch gap-base">
      {(['A', 'same', 'B'] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          disabled={disabled}
          aria-label={answered ? HEAR_LABEL[choice] : undefined}
          onClick={() => (answered ? hear(choiceEvents(question, choice, tempo)) : answer(choice))}
          className={cn(
            'ornament-corners flex min-h-40 flex-col items-center justify-center gap-tight rounded-lg border bg-card px-tight py-base outline-none transition-colors duration-fast ease-out-quart disabled:cursor-not-allowed',
            answerTileClass(answerTileState(choice, correct, selected, answered)),
            answered && (choice === correct || choice === selected) ? 'border-2' : 'border',
            choice === 'same' && (answered ? undefined : 'text-primary-strong'),
            choice !== 'same' && INITIAL_TONE[answerTileState(choice, correct, selected, answered)],
          )}
        >
          {choice === 'same' ? (
            <span className="font-display text-title leading-none">Same</span>
          ) : (
            <Initial letter={choice} className="text-display leading-none" />
          )}
          <span className="rubricated font-specimen text-meta text-muted-foreground">
            key {choice === 'same' ? 'S' : choice}
          </span>
          <OrnamentCorners />
        </button>
      ))}
    </div>
  );
}

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  return (
    <LessonRunner<Question, Answer, ExerciseOptions>
      options={options}
      exerciseTitle={EXERCISE_TITLE}
      title={title}
      lessonId={lessonId}
      onBack={onBack}
      onNextLesson={onNextLesson}
      generate={generate}
      buildEvents={(question) => buildQuestionEvents(question, options.tempo)}
      buildChoiceEvents={(question, choice) => choiceEvents(question, choice, options.tempo)}
      isCorrect={isCorrect}
      saveResult={recordLessonResult}
      prompt="Which interval is larger, or are they the same?"
      verdict={verdict}
      renderAnswers={(props) => <AnswerGrid {...props} tempo={options.tempo} />}
      renderReveal={(question) => <IntervalPair question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      answerKeys={ANSWER_KEYS}
    />
  );
}
