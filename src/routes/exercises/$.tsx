import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { exerciseById } from '@/exercises/navigation';

// Keep bookmarks from before browsing and practice had separate namespaces.
export const Route = createFileRoute('/exercises/$')({
  beforeLoad: ({ params, location, buildLocation }) => {
    const [id, page, lessonId, ...extra] = (params._splat ?? '').replace(/\/$/, '').split('/');
    const exercise = exerciseById(id);
    if (!exercise || extra.length > 0) throw notFound();

    let to: string = exercise.to;
    if (page === 'custom' && lessonId === undefined) {
      to += '/custom';
    } else if (page === 'lesson' && lessonId) {
      to += `/lessons/${encodeURIComponent(lessonId)}`;
    } else if (page !== undefined) {
      throw notFound();
    }

    // Resolve through the router so deployments under a base path stay inside it.
    // The destination still owns search validation; old custom URLs keep their options.
    throw redirect({
      href: buildLocation({ to, search: location.search, hash: location.hash }).publicHref,
      replace: true,
    });
  },
});
