import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { OptionCard, QuestionsSection, RangeSection, Section, TempoSection } from '@/components/custom/CustomParts';
import { CustomErrorFallback, CustomFrame } from '@/components/custom/CustomFrame';
import { IntervalPicker } from '@/components/custom/IntervalPicker';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import { describeQuestions, toggleInOrder } from '@/exercises/shared';
import {
  CUSTOM_MODE_HELP,
  CUSTOM_MODE_TITLE,
  NOTE_COUNTS,
  normalizeOptions,
  optionsFromSearch,
  parseCustomSearch,
  PLAYING_MODES,
  searchIntervals,
  searchModes,
  searchNoteCounts,
  TASK_HELP,
  validateOptions,
  type MultiPlayingMode,
  type NoteCount,
} from '@/exercises/multi-interval-identification';
import { Runner } from './-Runner';

const LESSONS_TO = '/practice/multi-interval-identification';
const CUSTOM_PREFS_KEY = 'polyhymnia:e3:customOptions';

export const Route = createFileRoute('/practice/multi-interval-identification/custom')({
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
  const noteCounts = searchNoteCounts(search);
  const modes = searchModes(search);

  const { update, reset } = useStoredSearch({
    prefsKey: CUSTOM_PREFS_KEY,
    parse: parseCustomSearch,
    search,
    navigate: (next) =>
      void navigate({
        to: '/practice/multi-interval-identification/custom',
        search: next,
        replace: true,
        resetScroll: false,
      }),
  });

  const toggleNoteCount = (count: NoteCount) =>
    update({ notes: toggleInOrder(noteCounts, count, NOTE_COUNTS).join(',') });

  const toggleMode = (mode: MultiPlayingMode) => update({ modes: toggleInOrder(modes, mode, PLAYING_MODES).join(',') });

  return (
    <CustomFrame
      lessonsTo={LESSONS_TO}
      help={TASK_HELP}
      summary={[
        `${intervals.length} intervals`,
        `${noteCounts.join('/')} notes`,
        modes.map((m) => CUSTOM_MODE_TITLE[m].toLowerCase()).join(', '),
        describeQuestions(search),
      ]}
      errors={validation.errors}
      onReset={reset}
      runner={(run) => <Runner options={runnerOptions} {...run} />}
    >
      <IntervalPicker
        description="The intervals that can appear above the lowest note, one by one or a set at a time."
        selected={intervals}
        onChange={(next) => update({ intervals: next.join(',') })}
        longNames={search.names === 'full'}
        onLongNamesChange={(long) => update({ names: long ? 'full' : 'short' })}
      />

      <Section
        title="Number of notes"
        description="How many notes are played, the lowest included. Pick one or more; each question uses one of them at random."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {NOTE_COUNTS.map((count) => (
            <OptionCard
              key={count}
              kind="checkbox"
              checked={noteCounts.includes(count)}
              title={`${count} notes`}
              text={`${count - 1} intervals to name.`}
              onSelect={() => toggleNoteCount(count)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Playing mode"
        description="How the notes are played. Pick one or more; each question uses one of them at random."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {PLAYING_MODES.map((mode) => (
            <OptionCard
              key={mode}
              kind="checkbox"
              checked={modes.includes(mode)}
              title={CUSTOM_MODE_TITLE[mode]}
              text={CUSTOM_MODE_HELP[mode]}
              onSelect={() => toggleMode(mode)}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <RangeSection search={search} description="Every note played stays between these two notes." update={update} />

        <TempoSection tempo={search.tempo} onSelect={(tempo) => update({ tempo })} />
      </div>

      <QuestionsSection search={search} update={update} />
    </CustomFrame>
  );
}
