import { Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { TimerOff } from 'lucide-react';
import { LessonFrame, LessonActions, LessonActionButton as Button } from './LessonFrame';
import { cn } from '@/lib/utils';
import { createSound, unlockSound, type Sound } from '@/lib/sound';
import {
  AUTO_NEXT_DELAY_MS,
  createLessonFlow,
  finishFlow,
  passedLesson,
  progressSegments,
  recordAnswer,
  scoreOf,
  type AnsweredQuestion,
  type LessonFlowState,
} from '@/exercises/shared';
import { LessonSummary } from './LessonSummary';
import { ExerciseMasthead } from './ExerciseMasthead';
import { Sheet } from '@/components/SheetLayout';

interface RunnerOptions {
  questionCount: number | 'endless';
  autoNext: boolean;
}

export interface AnswerRenderProps<Q, A> {
  question: Q;
  selected: A | null;
  answered: boolean;
  disabled: boolean;
  answer: (choice: A) => void;
  hear: (events: NoteEvent[]) => void;
}

export interface LessonRunnerProps<Q, A, O extends RunnerOptions> {
  options: O;
  exerciseTitle: string;
  title: string;
  lessonId?: string;
  onBack: () => void;
  onNextLesson?: () => void;
  generate: (options: O, previous?: Q) => Q;
  buildEvents: (question: Q) => NoteEvent[];
  buildChoiceEvents?: (question: Q, choice: A) => NoteEvent[];
  isCorrect: (question: Q, answer: A) => boolean;
  saveResult: (lessonId: string, percent: number, passed: boolean) => void;
  prompt: string | ((question: Q) => string);
  soundFactory?: () => Sound;
  verdict: (item: AnsweredQuestion<Q, A>) => string;
  renderAnswers: (props: AnswerRenderProps<Q, A>) => ReactNode;
  renderReveal: (question: Q, context?: 'answer' | 'summary') => ReactNode;
  revealPlaceholder: ReactNode;
  summaryNote?: (item: AnsweredQuestion<Q, A>) => string;
  answerKeys?: Record<string, A> | ((question: Q) => Record<string, A>);
}

type Phase = 'playing' | 'answered' | 'summary' | 'error';

interface RunnerState<Q, A> {
  flow: LessonFlowState<Q, A>;
  question: Q | null;
  phase: Phase;
  selected: A | null;
  playCount: number;
}

type Action<Q, A, O> =
  | { type: 'answer'; choice: A }
  | { type: 'next'; options: O }
  | { type: 'restart'; options: O }
  | { type: 'retryGeneration'; options: O }
  | { type: 'finish' };

function tryGenerate<Q, O>(generate: (options: O, previous?: Q) => Q, options: O, previous?: Q): Q | undefined {
  try {
    return generate(options, previous);
  } catch {
    return undefined;
  }
}

function makeReducer<Q, A, O extends RunnerOptions>(
  generate: (options: O, previous?: Q) => Q,
  isCorrect: (question: Q, answer: A) => boolean,
  lessonId: string | undefined,
) {
  return function reducer(state: RunnerState<Q, A>, action: Action<Q, A, O>): RunnerState<Q, A> {
    switch (action.type) {
      case 'answer': {
        if (state.phase !== 'playing' || !state.question) return state;
        const correct = isCorrect(state.question, action.choice);
        const flow = recordAnswer(state.flow, state.question, action.choice, correct);
        return { ...state, flow, phase: flow.finished ? 'summary' : 'answered', selected: action.choice };
      }
      case 'next': {
        if (state.phase !== 'answered' || state.flow.finished) return state;
        const question = tryGenerate(generate, action.options, state.question ?? undefined);
        if (!question) return { ...state, phase: 'error' };
        return { ...state, question, phase: 'playing', selected: null, playCount: state.playCount + 1 };
      }
      case 'finish': {
        const flow = finishFlow(state.flow);
        if (flow === state.flow) return state;
        return { ...state, flow, phase: 'summary' };
      }
      case 'restart': {
        const flow = createLessonFlow<Q, A>({ questionCount: action.options.questionCount, graded: !!lessonId });
        const question = tryGenerate(generate, action.options);
        if (!question) return { ...state, flow, question: null, phase: 'error', playCount: state.playCount + 1 };
        return { flow, question, phase: 'playing', selected: null, playCount: state.playCount + 1 };
      }
      case 'retryGeneration': {
        if (state.phase !== 'error') return state;
        const question = tryGenerate(generate, action.options, state.question ?? undefined);
        if (!question) return state;
        return { ...state, question, phase: 'playing', selected: null, playCount: state.playCount + 1 };
      }
      default:
        return state;
    }
  };
}

export function LessonRunner<Q, A, O extends RunnerOptions>({
  options,
  exerciseTitle,
  title,
  lessonId,
  onBack,
  onNextLesson,
  generate,
  buildEvents,
  buildChoiceEvents,
  isCorrect,
  saveResult,
  prompt,
  verdict,
  renderAnswers,
  renderReveal,
  revealPlaceholder,
  summaryNote,
  answerKeys,
  soundFactory = createSound,
}: LessonRunnerProps<Q, A, O>) {
  const [sound] = useState(soundFactory);
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const persistedRef = useRef(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const newQuestionRef = useRef<HTMLButtonElement>(null);

  const buildEventsRef = useRef(buildEvents);
  buildEventsRef.current = buildEvents;

  const reducer = useMemo(() => makeReducer<Q, A, O>(generate, isCorrect, lessonId), [generate, isCorrect, lessonId]);

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const flow = createLessonFlow<Q, A>({ questionCount: options.questionCount, graded: !!lessonId });
    const question = tryGenerate(generate, options);
    if (!question) {
      return { flow, question: null, phase: 'error' as Phase, selected: null, playCount: 0 };
    }
    return { flow, question, phase: 'playing' as Phase, selected: null, playCount: 0 };
  });

  useEffect(() => {
    persistedRef.current = false;
  }, [options]);

  useEffect(() => {
    if (state.phase !== 'summary' || !lessonId || persistedRef.current) return;
    persistedRef.current = true;
    const percent = Math.round(scoreOf(state.flow.answered) * 100);
    saveResult(lessonId, percent, passedLesson(state.flow));
  }, [state.phase, state.flow, lessonId, saveResult]);

  useEffect(() => unlockSound(), []);

  const playEvents = useCallback(
    (events: NoteEvent[]) => {
      setBlocked(false);
      const playback = sound.playEvents(events);
      void playback.finished.then((result) => {
        if (result === 'blocked') setBlocked(true);
      });
    },
    [sound],
  );

  const playQuestion = useCallback((question: Q) => playEvents(buildEventsRef.current(question)), [playEvents]);

  const play = useCallback(() => {
    if (!state.question) return;
    setStarted(true);
    playQuestion(state.question);
  }, [state.question, playQuestion]);

  const replay = useCallback(() => {
    if (state.phase === 'answered') setAutoPaused(true);
    play();
  }, [state.phase, play]);

  const replayQuestion = useCallback((q: Q) => playQuestion(q), [playQuestion]);

  const hear = useCallback(
    (events: NoteEvent[]) => {
      setAutoPaused(true);
      playEvents(events);
    },
    [playEvents],
  );

  useEffect(() => {
    if (!state.question) return;
    setStarted(false);
    setAutoPaused(false);
    play();
    playButtonRef.current?.focus();
    return () => {
      sound.stop();
    };
  }, [state.question, play, sound]);

  const answer = useCallback(
    (choice: A) => {
      if (state.phase !== 'playing') return;
      dispatch({ type: 'answer', choice });
    },
    [state.phase],
  );

  useEffect(() => {
    if (state.phase === 'answered' && !state.flow.finished) {
      newQuestionRef.current?.focus();
    }
  }, [state.phase, state.flow.finished]);

  useEffect(() => {
    if (state.phase !== 'playing') sound.stop();
  }, [state.phase, sound]);

  const goNext = useCallback(() => {
    if (state.phase !== 'answered' || state.flow.finished) return;
    dispatch({ type: 'next', options });
  }, [state.phase, state.flow.finished, options]);

  const lastAnswered = state.flow.answered[state.flow.answered.length - 1];

  const autoNextArmed =
    state.phase === 'answered' &&
    !state.flow.finished &&
    options.autoNext &&
    !autoPaused &&
    lastAnswered?.correct === true;

  useEffect(() => {
    if (!autoNextArmed) return;
    const id = window.setTimeout(goNext, AUTO_NEXT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [autoNextArmed, goNext]);

  useEffect(() => {
    const isTextInput = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const isInteractiveControl = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      !!el.closest('button, a, select, input, textarea, [contenteditable], [role="button"]');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (isInteractiveControl(e.target)) return;
        e.preventDefault();
        if (e.key === ' ') replay();
        else goNext();
        return;
      }
      if (!answerKeys) return;
      if (isTextInput(e.target)) return;
      const normalized = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const keys = typeof answerKeys === 'function' ? state.question && answerKeys(state.question) : answerKeys;
      const choice = keys?.[normalized];
      if (choice === undefined) return;
      e.preventDefault();
      if (state.phase === 'answered' && buildChoiceEvents && state.question) {
        hear(buildChoiceEvents(state.question, choice));
        return;
      }
      answer(choice);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [replay, goNext, answer, hear, answerKeys, buildChoiceEvents, state.phase, state.question]);

  const segments = useMemo(() => progressSegments(state.flow), [state.flow]);
  const answeredYet = state.phase !== 'playing';

  if (state.phase === 'error') {
    return (
      <Sheet size="message" className="flex flex-col items-center gap-base px-base py-section text-center">
        <nav aria-label="Breadcrumb" className="self-start">
          <ExerciseMasthead />
        </nav>
        <p className="rubricated font-specimen text-meta text-rubric-strong">{exerciseTitle}</p>
        <p className="text-body font-medium" role="status">
          Couldn&apos;t create a question.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => dispatch({ type: 'retryGeneration', options })}>Try again</Button>
        </div>
      </Sheet>
    );
  }

  const question = state.question!;

  if (state.phase === 'summary') {
    return (
      <LessonSummary
        exerciseTitle={exerciseTitle}
        title={title}
        flow={state.flow}
        onBack={onBack}
        onRetake={() => {
          persistedRef.current = false;
          dispatch({ type: 'restart', options });
        }}
        onNextLesson={onNextLesson}
        onReplayQuestion={replayQuestion}
        renderReveal={q => renderReveal(q, 'summary')}
        revealPlaceholder={revealPlaceholder}
        summaryNote={summaryNote}
      />
    );
  }

  return (
    <LessonFrame exerciseTitle={exerciseTitle} title={title} onBack={onBack}
      onFinish={state.flow.endless ? () => dispatch({ type: 'finish' }) : undefined}
      progress={state.flow.endless ? undefined : segments}
      currentIndex={state.phase === 'playing' ? state.flow.answered.length : undefined}>
      <p
        className={cn(
          'mx-auto max-w-[46ch] text-center font-display text-subhead',
          answeredYet && lastAnswered ? 'text-foreground' : 'text-muted-foreground',
        )}
        role="status"
      >
        {answeredYet && lastAnswered ? verdict(lastAnswered) : typeof prompt === 'function' ? prompt(question) : prompt}
      </p>

      {blocked && (
        <p className="text-center text-meta text-muted-foreground" role="status">
          Tap Play question to enable sound.
        </p>
      )}

      <Fragment key={state.playCount}>
        {renderAnswers({
          question,
          selected: state.selected,
          answered: answeredYet,
          disabled: !answeredYet && !started,
          answer,
          hear,
        })}
      </Fragment>

      <LessonActions>
        <Button
          ref={playButtonRef}
          variant="outline"
          onClick={replay}
          className="rubricated font-specimen text-subhead"
        >
          Play question
        </Button>
        {answeredYet && (
          <Button ref={newQuestionRef} onClick={goNext} className="rubricated font-specimen text-subhead">
            Next question
          </Button>
        )}
        {autoNextArmed && (
          <Button
            variant="outline"
            className="rubricated font-specimen relative overflow-hidden text-subhead"
            aria-label="Stay on this question"
            onClick={() => setAutoPaused(true)}
          >
            <TimerOff />
            Stay
            {autoNextArmed && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-countdown bg-primary-strong"
                style={{ animationDuration: `${AUTO_NEXT_DELAY_MS}ms` }}
              />
            )}
          </Button>
        )}
      </LessonActions>

      {answeredYet && <div className="flex justify-center">{renderReveal(question, 'answer')}</div>}
    </LessonFrame>
  );
}
