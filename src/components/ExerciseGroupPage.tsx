import { useMemo, type ReactNode } from 'react';
import { EXERCISE_GROUPS, type ExerciseGroupId } from '@/exercises/groups';
import { ExerciseIndexList } from './ExerciseIndexList';
import { TitleText } from './Initial';
import { AcanthusFleuron, AcanthusRule, AcanthusTitle } from './Acanthus';
import { Sheet } from './SheetLayout';
import { ExerciseMasthead } from './lesson/ExerciseMasthead';
import { WorkshopAside } from './lesson/WorkshopAside';

/** `illustration` sits beside the title and description; `closing` after the exercises, above the fleuron. */
export function ExerciseGroupPage({ groupId, settings, illustration, closing }: {
  groupId: ExerciseGroupId;
  settings?: ReactNode;
  illustration?: ReactNode;
  closing?: ReactNode;
}) {
  const group = EXERCISE_GROUPS.find(group => group.id === groupId)!;
  const exercises = useMemo(() => group.exercises.map(exercise => ({
    ...exercise,
    id: exercise.to.slice('/exercises/'.length),
  })), [group]);
  return (
    <Sheet className="flex flex-col gap-loose pt-loose" aside={<WorkshopAside modules={exercises} />} label={`${group.title} exercises`}>
      {/* Wide screens show it atop the sidebar; stacked, the sidebar starts rolled up. */}
      <nav aria-label="Breadcrumb" className="lg:hidden"><ExerciseMasthead /></nav>
      <div className="flex items-start gap-base">
        <header className="flex min-w-0 flex-1 flex-col gap-tight">
          <h1 aria-label={group.title} className="exercise-group-title font-display text-title">
            <TitleText title={group.title} />
          </h1>
          <p className="max-w-[64ch] text-body text-muted-foreground">{group.description}</p>
        </header>
        {illustration}
      </div>
      {settings}
      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <AcanthusTitle id="exercises" placement="above-fold">Exercises</AcanthusTitle>
        <ExerciseIndexList entries={exercises} />
        <AcanthusRule placement="below-fold" flipEnds />
      </section>
      {closing}
      <AcanthusFleuron className="-mt-4" />
    </Sheet>
  );
}
