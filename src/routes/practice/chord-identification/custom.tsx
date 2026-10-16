import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  HelpItem,
  HelpPopover,
  OptionCard,
  QuestionsSection,
  RangeSection,
  Section,
  SetChip,
  SubHeading,
  TempoSection,
} from '@/components/custom/CustomParts';
import { CustomErrorFallback, CustomFrame } from '@/components/custom/CustomFrame';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import { describeQuestions, sessionFromSearch, toggleInOrder } from '@/exercises/shared';
import { CHORDS, isChordId, type ChordId } from '@polyhymnia/music-theory';
import {
  CHORD_SETS,
  DIRECTIONS,
  DIRECTION_HELP,
  DIRECTION_TITLE,
  EXECUTIONS,
  EXECUTION_HELP,
  EXECUTION_TITLE,
  TASK_HELP,
  parseCustomSearch,
  toChordOptions,
  validateCustomOptions,
  type ArpeggioDirection,
  type CustomOptions,
  type CustomSearch,
  type Execution,
} from '@/exercises/chord-identification';
import { Runner } from './-Runner';

const LESSONS_TO = '/practice/chord-identification';
const CUSTOM_PREFS_KEY = 'polyhymnia:e4:customOptions';
const CHORD_IDS = CHORDS.map((chord) => chord.id);

function toRawOptions(search: CustomSearch): Partial<CustomOptions> {
  return {
    chords: search.chords.split(',').filter(isChordId),
    range: { low: search.low, high: search.high },
    executions: search.exec.split(',').filter(Boolean) as Execution[],
    directions: search.dirs.split(',').filter(Boolean) as ArpeggioDirection[],
    ...sessionFromSearch(search),
  };
}

export const Route = createFileRoute('/practice/chord-identification/custom')({
  component: CustomPage,
  validateSearch: parseCustomSearch,
  errorComponent: () => <CustomErrorFallback lessonsTo={LESSONS_TO} />,
});

function CustomPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const raw = useMemo(() => toRawOptions(search), [search]);
  const validation = useMemo(() => validateCustomOptions(raw), [raw]);
  const runnerOptions = useMemo(() => toChordOptions(raw), [raw]);
  const chords = raw.chords ?? [];
  const executions = raw.executions ?? [];
  const directions = raw.directions ?? [];
  const harmonicOnly = executions.length > 0 && executions.every((execution) => execution === 'harmonic');

  const { update, reset } = useStoredSearch({
    prefsKey: CUSTOM_PREFS_KEY,
    parse: parseCustomSearch,
    search,
    navigate: (next) =>
      void navigate({ to: '/practice/chord-identification/custom', search: next, replace: true, resetScroll: false }),
  });

  const selected = new Set<ChordId>(chords);
  const commitChords = (next: Set<ChordId>) =>
    update({
      chords: CHORDS.filter((chord) => next.has(chord.id))
        .map((chord) => chord.id)
        .join(','),
    });

  const setActive = (setChords: readonly ChordId[]) => setChords.every((id) => selected.has(id));

  const toggleSet = (setChords: readonly ChordId[]) => {
    const next = new Set(selected);
    const active = setActive(setChords);
    for (const id of setChords) {
      if (active) next.delete(id);
      else next.add(id);
    }
    commitChords(next);
  };

  const toggleChord = (id: ChordId) => update({ chords: toggleInOrder(chords, id, CHORD_IDS).join(',') });

  return (
    <CustomFrame
      lessonsTo={LESSONS_TO}
      help={TASK_HELP}
      summary={[
        `${selected.size} chords`,
        executions.map((e) => EXECUTION_TITLE[e].toLowerCase()).join(', '),
        describeQuestions(search),
      ]}
      errors={validation.errors}
      onReset={reset}
      runner={(run) => <Runner options={runnerOptions} {...run} />}
    >
      <Section
        title="Chords"
        description="The chords that can be played. Pick at least two, one by one or a set at a time."
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <SubHeading>Chord sets</SubHeading>
            <HelpPopover label="About the chord sets">
              {CHORD_SETS.map((set) => (
                <HelpItem key={set.id} term={set.title} text={set.help} />
              ))}
            </HelpPopover>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHORD_SETS.map((set) => (
              <SetChip key={set.id} active={setActive(set.chords)} onClick={() => toggleSet(set.chords)}>
                {set.title}
              </SetChip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {CHORDS.map((chord) => {
            const checked = selected.has(chord.id);
            return (
              <button
                key={chord.id}
                type="button"
                aria-pressed={checked}
                aria-label={chord.name}
                onClick={() => toggleChord(chord.id)}
                className={cn(
                  'flex flex-col items-center rounded-lg border px-2 py-1.5 text-meta leading-tight outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  checked
                    ? 'border-primary-strong bg-primary/15 font-medium text-primary-strong'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span>{chord.name}</span>
                <span className="text-meta opacity-75">{chord.symbol}</span>
              </button>
            );
          })}
        </div>
        <p className="text-meta text-muted-foreground">{selected.size} selected</p>
      </Section>

      <Section
        title="Execution"
        description="How each chord is played. Pick one or more; each question uses one of them at random."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {EXECUTIONS.map((execution) => (
            <OptionCard
              key={execution}
              kind="checkbox"
              checked={executions.includes(execution)}
              title={EXECUTION_TITLE[execution]}
              text={EXECUTION_HELP[execution]}
              onSelect={() => update({ exec: toggleInOrder(executions, execution, EXECUTIONS).join(',') })}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Direction"
        description="Which way the arpeggio runs. Not used when only Harmonic is ticked. Pick one or both."
      >
        <fieldset
          disabled={harmonicOnly}
          className={cn('m-0 grid min-w-0 gap-2 border-0 p-0 sm:grid-cols-2', harmonicOnly && 'opacity-50')}
        >
          {DIRECTIONS.map((direction) => (
            <OptionCard
              key={direction}
              kind="checkbox"
              checked={directions.includes(direction)}
              title={DIRECTION_TITLE[direction]}
              text={DIRECTION_HELP[direction]}
              onSelect={() => update({ dirs: toggleInOrder(directions, direction, DIRECTIONS).join(',') })}
            />
          ))}
        </fieldset>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <RangeSection
          search={search}
          description="Every note of the chord stays between these two notes."
          update={update}
        />

        <TempoSection tempo={search.tempo} onSelect={(tempo) => update({ tempo })} />
      </div>

      <QuestionsSection search={search} update={update} />
    </CustomFrame>
  );
}
