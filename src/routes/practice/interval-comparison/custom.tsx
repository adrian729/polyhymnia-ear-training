import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { OptionCard, QuestionsSection, RangeSection, Section, TempoSection } from '@/components/custom/CustomParts';
import { CustomErrorFallback, CustomFrame } from '@/components/custom/CustomFrame';
import { IntervalPicker } from '@/components/custom/IntervalPicker';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import {
  MODE_HELP,
  describeQuestions,
  MODE_TITLE,
  sessionFromSearch,
  toggleInOrder,
  type IntervalId,
  type PlayingMode,
} from '@/exercises/shared';
import {
  FIRST_NOTE_HELP,
  normalizeOptions,
  parseCustomSearch,
  PLAYING_MODES,
  RELATIONSHIP_HELP,
  RELATIONSHIP_TITLE,
  TASK_HELP,
  TONE_RELATIONSHIPS,
  validateExerciseOptions,
  type CustomSearch,
  type ExerciseOptions,
} from '@/exercises/interval-comparison';
import { Runner } from './-Runner';

const LESSONS_TO = '/practice/interval-comparison';
const CUSTOM_PREFS_KEY = 'polyhymnia:e1:customOptions';

function toRawOptions(search: CustomSearch): Partial<ExerciseOptions> {
  return {
    intervals: search.intervals.split(',').filter(Boolean) as IntervalId[],
    playingModes: search.modes.split(',').filter(Boolean) as PlayingMode[],
    toneRelationship: search.rel,
    range: { low: search.low, high: search.high },
    ...sessionFromSearch(search),
  };
}

export const Route = createFileRoute('/practice/interval-comparison/custom')({
  component: CustomPage,
  validateSearch: parseCustomSearch,
  errorComponent: () => <CustomErrorFallback lessonsTo={LESSONS_TO} />,
});

function CustomPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const raw = useMemo(() => toRawOptions(search), [search]);
  const validation = useMemo(() => validateExerciseOptions(raw), [raw]);
  const runnerOptions = useMemo(() => normalizeOptions(raw), [raw]);
  const rawIntervals = raw.intervals ?? [];
  const rawModes = raw.playingModes ?? [];
  const longNames = search.names === 'full';

  const { update, reset } = useStoredSearch({
    prefsKey: CUSTOM_PREFS_KEY,
    parse: parseCustomSearch,
    search,
    navigate: (next) =>
      void navigate({ to: '/practice/interval-comparison/custom', search: next, replace: true, resetScroll: false }),
  });

  const toggleMode = (mode: PlayingMode) => update({ modes: toggleInOrder(rawModes, mode, PLAYING_MODES).join(',') });

  return (
    <CustomFrame
      lessonsTo={LESSONS_TO}
      help={TASK_HELP}
      summary={[
        `${new Set(rawIntervals).size} intervals`,
        rawModes.map((m) => MODE_TITLE[m].toLowerCase()).join(', '),
        describeQuestions(search),
      ]}
      errors={validation.errors}
      onReset={reset}
      runner={(run) => <Runner options={runnerOptions} {...run} />}
    >
      <IntervalPicker
        description="The interval sizes that can be compared. Pick at least two, one by one or a set at a time."
        selected={rawIntervals}
        onChange={(intervals) => update({ intervals: intervals.join(',') })}
        longNames={longNames}
        onLongNamesChange={(long) => update({ names: long ? 'full' : 'short' })}
      />

      <Section
        title="Playing mode"
        description="How the two notes of each interval are played. Pick one or more; each question uses one of them at random."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAYING_MODES.map((mode) => (
            <OptionCard
              key={mode}
              kind="checkbox"
              checked={rawModes.includes(mode)}
              title={MODE_TITLE[mode]}
              text={MODE_HELP[mode]}
              onSelect={() => toggleMode(mode)}
            />
          ))}
        </div>
      </Section>

      <Section title="Starting notes" description={`How the notes of A and B relate to each other. ${FIRST_NOTE_HELP}`}>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Starting notes">
          {TONE_RELATIONSHIPS.map((rel) => (
            <OptionCard
              key={rel}
              kind="radio"
              checked={search.rel === rel}
              title={RELATIONSHIP_TITLE[rel]}
              text={RELATIONSHIP_HELP[rel]}
              onSelect={() => update({ rel })}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <RangeSection
          search={search}
          description="Every note of both intervals stays between these two notes."
          update={update}
        />

        <TempoSection tempo={search.tempo} onSelect={(tempo) => update({ tempo })} />
      </div>

      <QuestionsSection search={search} update={update} />
    </CustomFrame>
  );
}
