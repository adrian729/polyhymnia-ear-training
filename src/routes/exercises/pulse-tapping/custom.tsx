import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CustomFrame } from '@/components/custom/CustomFrame';
import { OptionCard, Section } from '@/components/custom/CustomParts';
import { useStoredSearch } from '@/components/custom/useStoredSearch';
import { CONTROL_CLASS } from '@/components/rhythm/TimingSetup';
import { toggleInOrder } from '@/exercises/shared/customSearch';
import { parseCustomSearch, optionsFromSearch } from '@/exercises/pulse-tapping/customSearch';
import { DEFAULT_OPTIONS, METRES, VARIANTS, VARIANT_TITLE, validateExerciseOptions } from '@/exercises/pulse-tapping/options';
import { Runner } from './-Runner';

const PATTERN_HELP = {
  regular: 'Tap every beat in 2/4, 3/4 or 4/4.',
  compound: 'Tap the two larger beats in 6/8.',
  skip: 'Hear all four beats in 4/4; tap only the beats you select below.',
  backbeat: 'Tap all four beats in 4/4 while clicks sound on 2 & 4.',
  offbeat: 'Tap all four beats in 4/4 while clicks sound between them.',
};
const METRE_HELP = {
  '2/4': 'Two quarter-note beats per bar. Regular pulse.',
  '3/4': 'Three quarter-note beats per bar. Regular pulse.',
  '4/4': 'Four quarter-note beats per bar. Regular pulse, skipped beats or displaced clicks.',
  '6/8': 'Two dotted-quarter beats per bar. Compound pulse.',
};

export const Route = createFileRoute('/exercises/pulse-tapping/custom')({ component: CustomPage, validateSearch: parseCustomSearch });
function CustomPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { update, reset } = useStoredSearch({ prefsKey: 'polyhymnia:pulse:custom:v1', parse: parseCustomSearch, search,
    navigate: next => void navigate({ to: '/exercises/pulse-tapping/custom', search: next, replace: true, resetScroll: false }) });
  const options = optionsFromSearch(search);
  return <CustomFrame lessonsTo="/exercises/pulse-tapping"
    help="Pick one or more click patterns and metres. Each attempt chooses a selected pattern and a compatible selected metre. Hear one bar of count-in, then tap using Space or the pad."
    summary={[`${options.variants.length} ${options.variants.length === 1 ? 'pattern' : 'patterns'}`, options.metres.join(', '), `${search.minBpm === search.maxBpm ? search.minBpm : `${search.minBpm}–${search.maxBpm}`} pulse BPM`, `${search.bars} bars`, `${search.count} attempts`]}
    errors={validateExerciseOptions(options)} onReset={reset} runner={run => <Runner key={JSON.stringify(options)} options={options} {...run} />}>
    <Section title="Click patterns" description="Pick one or more; each attempt uses one at random. Select at least one compatible metre for every pattern.">
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Click patterns">
        {VARIANTS.map(variant => <OptionCard key={variant} kind="checkbox" checked={options.variants.includes(variant)}
          title={VARIANT_TITLE[variant]} text={PATTERN_HELP[variant]}
          onSelect={() => update({ variants: toggleInOrder(options.variants, variant, VARIANTS).join(',') })} />)}
      </div>
    </Section>
    <Section title="Metres" description="Pick one or more; each attempt uses a metre compatible with its click pattern.">
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Metres">
        {METRES.map(metre => <OptionCard key={metre} kind="checkbox" checked={options.metres.includes(metre)}
          title={metre} text={METRE_HELP[metre]}
          onSelect={() => update({ metres: toggleInOrder(options.metres, metre, METRES).join(',') })} />)}
      </div>
    </Section>
    <div className="grid gap-base sm:grid-cols-2">
      <label className="flex flex-col gap-tight">Minimum pulse BPM (40–180)
        <input className={CONTROL_CLASS} type="number" min={40} max={180} step={1} value={Number.isFinite(search.minBpm) ? search.minBpm : ''} onChange={e => update({ minBpm: Number(e.target.value) })} />
      </label>
      <label className="flex flex-col gap-tight">Maximum pulse BPM (40–180)
        <input className={CONTROL_CLASS} type="number" min={40} max={180} step={1} value={Number.isFinite(search.maxBpm) ? search.maxBpm : ''} onChange={e => update({ maxBpm: Number(e.target.value) })} />
      </label>
      <label className="flex flex-col gap-tight">Response bars
        <select className={CONTROL_CLASS} value={search.bars} onChange={e => update({ bars: Number(e.target.value) as typeof search.bars })}>{[2, 4, 8].map(n => <option key={n}>{n}</option>)}</select>
      </label>
      <label className="flex flex-col gap-tight">Session
        <select className={CONTROL_CLASS} value={search.count === 'endless' ? 'endless' : 'finite'} onChange={e => update({ count: e.target.value === 'endless' ? 'endless' : DEFAULT_OPTIONS.count })}><option value="finite">Finite attempts</option><option value="endless">Endless practice</option></select>
      </label>
      {search.count !== 'endless' && <label className="flex flex-col gap-tight">Attempt count (1–200)
        <input className={CONTROL_CLASS} type="number" min={1} max={200} value={Number.isFinite(search.count) ? search.count : ''} onChange={e => update({ count: Number(e.target.value) })} />
      </label>}
    </div>
    <p className="text-meta text-muted-foreground">Each attempt uses a tempo in this range. Set minimum and maximum to the same BPM for a fixed tempo.</p>
    <label className="flex items-center gap-tight"><input type="checkbox" checked={search.guided} onChange={e => update({ guided: e.target.checked })} /> Show visual response guide (guided practice)</label>
    {options.variants.includes('compound') && <label className="flex items-center gap-tight"><input type="checkbox" checked={search.subdivisions} onChange={e => update({ subdivisions: e.target.checked })} /> Keep quiet three-way subdivisions during response</label>}
    {options.variants.includes('skip') && <fieldset className="flex flex-wrap gap-base"><legend className="mb-tight">Beats to tap</legend>{[1, 2, 3, 4].map(beat => <label key={beat} className="flex items-center gap-tight"><input type="checkbox" checked={options.targetBeats.includes(beat)}
      onChange={e => update({ beats: (e.target.checked ? [...options.targetBeats, beat] : options.targetBeats.filter(n => n !== beat)).sort().join(',') })} />{beat}</label>)}</fieldset>}
    <p className="text-meta text-muted-foreground">Sound and timing use your Rhythm settings from the lessons page.</p>
  </CustomFrame>;
}
