import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { OptionCard, QuestionsSection, RangeSection, Section, TempoSection } from '@/components/custom/CustomParts';
import { CustomErrorFallback, CustomFrame } from '@/components/custom/CustomFrame';
import { IntervalPicker } from '@/components/custom/IntervalPicker';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import { describeQuestions, MODE_HELP, MODE_TITLE, toggleInOrder, type PlayingMode } from '@/exercises/shared';
import {
  normalizeOptions,
  optionsFromSearch,
  parseCustomSearch,
  PLAYING_MODES,
  searchIntervals,
  searchModes,
  TASK_HELP,
  validateOptions,
} from '@/exercises/interval-identification';
import { Runner } from './-Runner';

const LESSONS_TO = '/practice/interval-identification';
const CUSTOM_PREFS_KEY = 'polyhymnia:e2:customOptions';

export const Route = createFileRoute('/practice/interval-identification/custom')({
  component: CustomPage,
  validateSearch: parseCustomSearch,
  errorComponent: () => <CustomErrorFallback lessonsTo={LESSONS_TO} />,
});

function CustomPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const raw = useMemo(() => optionsFromSearch(search), [search]);
  const validation = useMemo(() => validateOptions(raw), [raw]);
  const runnerOptions = useMemo(() => normalizeOptions(raw), [raw]);
  const intervals = searchIntervals(search);
  const modes = searchModes(search);

  const { update, reset } = useStoredSearch({
    prefsKey: CUSTOM_PREFS_KEY,
    parse: parseCustomSearch,
    search,
    navigate: (next) =>
      void navigate({
        to: '/practice/interval-identification/custom',
        search: next,
        replace: true,
        resetScroll: false,
      }),
  });

  const toggleMode = (mode: PlayingMode) => update({ modes: toggleInOrder(modes, mode, PLAYING_MODES).join(',') });

  return (
    <CustomFrame
      lessonsTo={LESSONS_TO}
      help={TASK_HELP}
      summary={[
        `${intervals.length} intervals`,
        modes.map((m) => MODE_TITLE[m].toLowerCase()).join(', '),
        describeQuestions(search),
      ]}
      errors={validation.errors}
      onReset={reset}
      runner={(run) => <Runner options={runnerOptions} {...run} />}
    >
      <IntervalPicker
        description="The intervals that can be asked, one by one or a set at a time."
        selected={intervals}
        onChange={(next) => update({ intervals: next.join(',') })}
        longNames={search.names === 'full'}
        onLongNamesChange={(long) => update({ names: long ? 'full' : 'short' })}
      />

      <Section
        title="Playing mode"
        description="How the interval is played. Pick one or more; each question uses one of them at random."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAYING_MODES.map((mode) => (
            <OptionCard
              key={mode}
              kind="checkbox"
              checked={modes.includes(mode)}
              title={MODE_TITLE[mode]}
              text={MODE_HELP[mode]}
              onSelect={() => toggleMode(mode)}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <RangeSection
          search={search}
          description="Every note of the interval stays between these two notes."
          update={update}
        />

        <TempoSection tempo={search.tempo} onSelect={(tempo) => update({ tempo })} />
      </div>

      <QuestionsSection search={search} update={update} />
    </CustomFrame>
  );
}
