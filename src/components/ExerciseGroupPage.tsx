import { useMemo, type ReactNode } from 'react';
import { EXERCISE_GROUPS, type ExerciseGroupId } from '@/exercises/groups';
import { ExerciseIndexList } from './ExerciseIndexList';
import { TitleText } from './Initial';
import { FlourishRule, Ornament } from './Ornament';
import { Sheet } from './SheetLayout';
import { ExerciseMasthead } from './lesson/ExerciseMasthead';
import { WorkshopAside } from './lesson/WorkshopAside';

export function ExerciseGroupPage({ groupId, settings }: { groupId: ExerciseGroupId; settings?: ReactNode }) {
  const group = EXERCISE_GROUPS.find(group => group.id === groupId)!;
  const exercises = useMemo(() => group.exercises.map(exercise => ({
    ...exercise,
    id: exercise.to.slice('/exercises/'.length),
  })), [group]);
  return (
    <Sheet className="flex flex-col gap-loose py-loose" aside={<WorkshopAside modules={exercises} />} label={`${group.title} exercises`}>
      {/* Wide screens show it atop the sidebar; stacked, the sidebar starts rolled up. */}
      <nav aria-label="Breadcrumb" className="lg:hidden"><ExerciseMasthead /></nav>
      <header className="flex flex-col gap-tight">
        <h1 aria-label={group.title} className="exercise-group-title font-display text-title">
          <TitleText title={group.title} />
        </h1>
        <p className="max-w-[64ch] text-body text-muted-foreground">{group.description}</p>
      </header>
      {settings}
      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="rubricated font-specimen text-subhead text-muted-foreground">Exercises</h2>
        <FlourishRule />
        <ExerciseIndexList entries={exercises} />
        <FlourishRule />
      </section>
      <Ornament name="tailpiece" className="mx-auto size-14 text-primary-strong" />
    </Sheet>
  );
}
