import { useMemo } from 'react';
import { EXERCISE_GROUPS, type ExerciseGroupId } from '@/exercises/groups';
import { ExerciseIndexList } from './ExerciseIndexList';
import { TitleText } from './Initial';
import { FlourishRule, Ornament } from './Ornament';
import { PaperSheet } from './PaperSheet';
import { WorkshopAside } from './lesson/WorkshopAside';

export function ExerciseGroupPage({ groupId }: { groupId: ExerciseGroupId }) {
  const group = EXERCISE_GROUPS.find(group => group.id === groupId)!;
  const exercises = useMemo(() => group.exercises.map(exercise => ({
    ...exercise,
    id: exercise.to.slice('/exercises/'.length),
  })), [group]);
  return (
    <div className="workshop-layout">
      <WorkshopAside modules={exercises} />
      <div className="workshop-pane" data-workshop-main role="region" aria-label={`${group.title} exercises`} tabIndex={0}>
        <PaperSheet className="flex flex-col gap-loose py-loose">
          <header className="flex flex-col gap-tight">
            <h1 aria-label={group.title} className="exercise-group-title font-display text-title">
              <TitleText title={group.title} />
            </h1>
            <p className="max-w-[64ch] text-body text-muted-foreground">{group.description}</p>
          </header>
          <section aria-labelledby="exercises" className="flex flex-col gap-base">
            <h2 id="exercises" className="rubricated font-specimen text-subhead text-muted-foreground">Exercises</h2>
            <FlourishRule />
            <ExerciseIndexList entries={exercises} />
            <FlourishRule />
          </section>
          <Ornament name="tailpiece" className="mx-auto size-14 text-primary-strong" />
        </PaperSheet>
      </div>
    </div>
  );
}
