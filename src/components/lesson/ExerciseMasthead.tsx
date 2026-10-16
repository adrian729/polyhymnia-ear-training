import { Link, useRouterState } from '@tanstack/react-router';
import { EXERCISE_GROUPS } from '@/exercises/groups';
import { exerciseById } from '@/exercises/navigation';
import { LOGO } from '@/lib/logo';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { PolyhymniaName } from '../PolyhymniaName';

export function ExerciseMasthead() {
  const { routeId, lessonTitle } = useRouterState({ select: state => {
    const match = state.matches.at(-1);
    const data = match?.loaderData;
    return {
      routeId: match?.routeId ?? '',
      lessonTitle: data && typeof data === 'object' && 'title' in data && typeof data.title === 'string' ? data.title : undefined,
    };
  } });
  const [, section, id, page] = routeId.split('/');
  const group = section === 'exercises' ? EXERCISE_GROUPS.find(group => group.id === id) : undefined;
  const exercise = section === 'practice' ? exerciseById(id) : undefined;
  const currentPage = page === 'custom' ? 'Custom exercise' : page === 'lessons' ? lessonTitle ?? 'Lesson' : undefined;

  return (
    <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-tight text-start text-meta text-muted-foreground">
      <li className="basis-full">
        <Link
          to="/"
          aria-label="Index – Polyhymnia"
          className="group rubricated font-specimen inline-flex items-center gap-2.5 self-start rounded-sm text-subhead text-muted-foreground outline-none transition-colors hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ResponsiveImage {...LOGO} placement="above-fold" sizes="calc(1.75rem * 706 / 735)" alt="" width={706} height={735} className="h-7 w-auto shrink-0" />
          <span>Index</span>
          <span aria-hidden="true">–</span>
          <PolyhymniaName className="transition-colors group-hover:text-primary-strong" />
        </Link>
      </li>
      {group && <li aria-current="page">{group.title}</li>}
      {exercise && <li>
        {currentPage ? (
          <Link to={exercise.to} className="rounded-sm underline decoration-border underline-offset-4 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {exercise.title}
          </Link>
        ) : <span aria-current="page">{exercise.title}</span>}
      </li>}
      {exercise && currentPage && <li className="flex min-w-0 items-baseline gap-2">
        <span aria-hidden="true">/</span>
        <span aria-current="page">{currentPage}</span>
      </li>}
    </ol>
  );
}
