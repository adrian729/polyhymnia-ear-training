import { intervalBetween, intervalDisplayName, parsePitch, type IntervalId } from '@polyhymnia/music-theory';
import { NotesReveal } from '@/components/presets/NotesReveal';
import { RevealStaff } from '@/components/lesson/RevealStaff';
import { LessonRunner } from '@/components/lesson/LessonRunner';
import type { AnsweredQuestion } from '@/exercises/shared';
import {
  buildQuestionEvents,
  EXERCISE_TITLE,
  generateQuestion,
  questionSignature,
  recordLessonResult,
  type MultiIntervalOptions,
  type Question,
} from '@/exercises/multi-interval-identification';
import { AnswerRows } from './-AnswerRows';

interface RunnerProps {
  options: MultiIntervalOptions;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
}

type Answer = readonly IntervalId[];

function generate(options: MultiIntervalOptions, previous?: Question): Question {
  return generateQuestion(options, Math.random, previous && questionSignature(previous));
}

function isCorrect(question: Question, answer: Answer): boolean {
  return question.rows.every((row, i) => row.size === answer[i]);
}

function verdict({ question, correct }: AnsweredQuestion<Question, Answer>): string {
  const intervals = question.rows.map((row) => row.size).join(', ');
  return correct ? `Correct: ${intervals}` : `Wrong: the answer was ${intervals}, from the lowest note up`;
}

function captions(question: Question): string[] {
  const nameOf = new Map(
    question.rows.map((row) => {
      const interval = intervalBetween(parsePitch(question.reference), parsePitch(row.pitch));
      return [row.pitch, intervalDisplayName(interval.degree, interval.quality)];
    }),
  );
  return question.sounding.map((pitch) => nameOf.get(pitch) ?? 'Lowest note');
}

function StackReveal({ question }: { question: Question }) {
  return (
    <RevealStaff className="box-content pb-8">
      <NotesReveal pitches={question.sounding} clef={question.clef} mode="melodic" labels={captions(question)} />
    </RevealStaff>
  );
}

const REVEAL_PLACEHOLDER = (
  <RevealStaff className="box-content pb-8">
    <div className="flex-1 rounded-md bg-muted" />
  </RevealStaff>
);

export function Runner({ options, title, lessonId, onBack, onNextLesson }: RunnerProps) {
  const events = (question: Question) => buildQuestionEvents(question, options.tempo);

  return (
    <LessonRunner<Question, Answer, MultiIntervalOptions>
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
      prompt="Name each note's interval above the lowest note."
      verdict={verdict}
      renderAnswers={(props) => <AnswerRows {...props} intervals={options.intervals} events={events} />}
      renderReveal={(question) => <StackReveal question={question} />}
      revealPlaceholder={REVEAL_PLACEHOLDER}
      summaryNote={(item) => ` — you answered ${item.answer.join(', ')}`}
    />
  );
}
