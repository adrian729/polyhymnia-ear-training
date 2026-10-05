import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CustomFrame } from '@/components/custom/CustomFrame';
import { QuestionsSection } from '@/components/custom/CustomParts';
import { PitchMatching } from '@/components/audio/PitchMatching';
import { PitchSetup } from '@/components/audio/PitchSetup';
import { NumericSetting } from '@/components/audio/NumericSetting';
import { useExerciseMicrophone } from '@/components/audio/MicrophoneProvider';
import { readPitchSettings, savePitchSettings } from '@/exercises/pitch-matching/settings';
import { DEFAULT_OPTIONS } from '@/exercises/pitch-matching/catalog';
import { normalizeQuestionCount, type SessionSearch } from '@/exercises/shared';

export const Route = createFileRoute('/exercises/pitch-matching/custom')({ component: CustomPage });
const DEFAULT_SESSION: Pick<SessionSearch, 'count' | 'endless' | 'auto'> = { count: '5', endless: '0', auto: '0' };
function CustomPage() {
  const microphone = useExerciseMicrophone();
  const [settings, setSettings] = useState(readPitchSettings);
  const [session, setSession] = useState(DEFAULT_SESSION);
  const [criteria, setCriteria] = useState({ cents: DEFAULT_OPTIONS.cents, seconds: DEFAULT_OPTIONS.seconds });
  const questionCount = session.endless === '1' ? 'endless' : normalizeQuestionCount(Number(session.count));
  return <CustomFrame lessonsTo="/exercises/pitch-matching" help="Hear a note, then sing it back."
    summary={[questionCount === 'endless' ? 'Endless' : `${questionCount} notes`, `±${criteria.cents} cents`, `${criteria.seconds} s hold`]}
    errors={[]} startDisabledReason={microphone.resource ? undefined : 'Enable the microphone above to start.'}
    onReset={() => { setSession(DEFAULT_SESSION); setCriteria({ cents: DEFAULT_OPTIONS.cents, seconds: DEFAULT_OPTIONS.seconds }); }}
    runner={run => <PitchMatching {...run} options={{ questionCount, autoNext: session.auto === '1', ...criteria }} />}>
    <PitchSetup value={settings} onChange={value => { savePitchSettings(value); setSettings(value); }} />
    <fieldset className="flex flex-col gap-base">
      <legend className="mb-tight font-display text-subhead">Match criteria</legend>
      <div className="grid gap-base sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">Pitch tolerance (cents)
          <NumericSetting min={10} max={100} step={5} value={criteria.cents} onChange={cents => setCriteria({ ...criteria, cents })} />
        </label>
        <label className="flex min-w-0 flex-col gap-tight text-meta text-muted-foreground">Continuous hold (seconds)
          <NumericSetting min={0.25} max={3} step={0.25} value={criteria.seconds} onChange={seconds => setCriteria({ ...criteria, seconds })} />
        </label>
      </div>
    </fieldset>
    <QuestionsSection search={session} update={patch => setSession({ ...session, ...patch })} />
  </CustomFrame>;
}
