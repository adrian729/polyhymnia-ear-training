import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';
import { CustomFrame } from '@/components/custom/CustomFrame';
import { OptionCard, Section } from '@/components/custom/CustomParts';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import { toggleInOrder } from '@/exercises/shared/customSearch';
import { CATALOG, lessons, modules, overview, resultKey, resultStore, validateOptions, type Kind } from '@/exercises/rhythm-practice/catalog';
import { availableMetres, optionsFromSearch, SEARCH_PARSERS, type PracticeSearch } from '@/exercises/rhythm-practice/customSearch';
import { getTimingLessonResult, readTimingPreferences, saveTimingPreferences } from '@/exercises/shared/rhythm/store';
import { TimingSetup, CONTROL_CLASS } from './TimingSetup';
import { PracticeRunner } from './PracticeRunner';

type WorkshopPath = `/exercises/${Kind}`;
type CustomPath = `/exercises/${Kind}/custom`;
type LessonPath = `/exercises/${Kind}/lesson/$lessonId`;

export function PracticeWorkshop({ kind }: { kind: Kind }) {
  const [preferences, setPreferences] = useState(readTimingPreferences);
  const definition = CATALOG[kind];
  const list = lessons(kind);
  return <WorkshopPage title={definition.title} blurb={definition.blurb} modules={modules(kind)} overview={overview(kind)} soundControls={null}
    lessonsForModule={moduleId => list.filter(lesson => lesson.moduleId === moduleId)}
    getLessonResult={id => definition.timed ? getTimingLessonResult(resultKey(id, list.find(l => l.id === id)!.options, preferences)) : resultStore.getLessonResult(resultKey(id, list.find(l => l.id === id)!.options))}
    headerAction={<div className="flex flex-col gap-base">
      {definition.timed && <TimingSetup value={preferences} onChange={value => { saveTimingPreferences(value); setPreferences(value); }} />}
      <Button asChild variant="outline" className="self-start"><Link to={`/exercises/${kind}/custom` as CustomPath} search={SEARCH_PARSERS[kind]({})}>Set up custom exercise</Link></Button>
    </div>}
    renderLessonLink={(lessonId, className, children) => <Link to={`/exercises/${kind}/lesson/$lessonId` as LessonPath} params={{ lessonId }} className={className}>{children}</Link>} />;
}
function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(Number.isFinite(value) ? String(value) : ''); }, [value]);
  return <label className="flex flex-col gap-tight">{label}<input type="number" min={min} max={max} step={1} className={CONTROL_CLASS}
    onFocus={() => { editing.current = true; }} onBlur={() => { editing.current = false; }}
    value={draft} onChange={e => {
      const next = Number(e.target.value);
      setDraft(e.target.value); onChange(next);
    }} /></label>;
}
export function PracticeCustom({ kind, search, navigate }: { kind: Kind; search: PracticeSearch; navigate: (search: PracticeSearch) => void }) {
  const { update, reset } = useStoredSearch({ prefsKey: `polyhymnia:${kind}:custom:v1`, parse: SEARCH_PARSERS[kind], search, navigate });
  const options = optionsFromSearch(kind, search);
  const definition = CATALOG[kind];
  const variantIds = definition.variants.map(v => v.id);
  const metres = availableMetres(kind);
  return <CustomFrame lessonsTo={`/exercises/${kind}` as WorkshopPath} help={definition.blurb}
    summary={[`${options.variants.length} variations`, options.metres.join(', '), `${search.minBpm === search.maxBpm ? search.minBpm : `${search.minBpm}–${search.maxBpm}`} pulse BPM`, `${search.count} attempts`]}
    errors={validateOptions(options)} onReset={reset} runner={run => <PracticeRunner key={JSON.stringify(options)} options={options} {...run} />}>
    <Section title="Variations" description="Select one or more. Each attempt chooses one of your selections.">
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Variations">{definition.variants.map(v => <OptionCard key={v.id} kind="checkbox" checked={options.variants.includes(v.id)} title={v.title} text={v.text}
        onSelect={() => update({ variants: toggleInOrder(options.variants, v.id, variantIds).join(',') })} />)}</div>
    </Section>
    <Section title="Metres" description={kind === 'metre-identification' ? 'Select at least two compatible metres for each variation.' : 'Select one or more, with a compatible metre for each variation.'}>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Metres">{metres.map(m => <OptionCard key={m} kind="checkbox" checked={options.metres.includes(m)} title={m}
        text={m === '6/8' ? 'Two dotted-quarter pulses per bar.' : `${m[0]} quarter-note pulses per bar.`}
        onSelect={() => update({ metres: toggleInOrder(options.metres, m, metres).join(',') })} />)}</div>
    </Section>
    <div className="grid gap-base sm:grid-cols-2">
      <NumberField label="Minimum pulse BPM (40–180)" min={40} max={180} value={search.minBpm} onChange={n => update({ minBpm: n })} />
      <NumberField label="Maximum pulse BPM (40–180)" min={40} max={180} value={search.maxBpm} onChange={n => update({ maxBpm: n })} />
      <label className="flex flex-col gap-tight">Session<select className={CONTROL_CLASS} value={search.count === 'endless' ? 'endless' : 'finite'} onChange={e => update({ count: e.target.value === 'endless' ? 'endless' : 5 })}><option value="finite">Finite attempts</option><option value="endless">Endless practice</option></select></label>
      {search.count !== 'endless' && <NumberField label="Attempt count (1–200)" min={1} max={200} value={search.count} onChange={n => update({ count: n })} />}
    </div>
    <p className="text-meta text-muted-foreground">Set minimum and maximum to the same BPM for a fixed tempo.{definition.timed && ' Sound, tolerance and input lag use your Rhythm settings from the lessons page.'}</p>
  </CustomFrame>;
}
