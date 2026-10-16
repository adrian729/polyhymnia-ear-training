import { createMemoryHistory, createRouter, isNotFound } from '@tanstack/react-router';
import { expect, it } from 'vitest';
import { routeTree } from '@/routeTree.gen';
import { LESSONS } from '@/exercises/interval-comparison';

it.each([
  { basepath: '/', oldPath: '/exercises/interval-comparison/#thirds', path: '/practice/interval-comparison', hash: 'thirds' },
  { basepath: '/polyhymnia-ear-training/', oldPath: '/exercises/interval-comparison/custom?count=12&names=short#options', path: '/practice/interval-comparison/custom', hash: 'options' },
  { basepath: '/polyhymnia-ear-training/', oldPath: `/exercises/interval-comparison/lesson/${LESSONS[0].id}`, path: `/practice/interval-comparison/lessons/${LESSONS[0].id}`, hash: '' },
])('redirects old exercise links with their location intact: $oldPath', async ({ basepath, oldPath, path, hash }) => {
  const prefix = basepath.replace(/\/$/, '');
  const history = createMemoryHistory({ initialEntries: [basepath, `${prefix}${oldPath}`] });
  const router = createRouter({ routeTree, history, basepath, isServer: false, origin: 'http://localhost' });
  await router.load();

  expect(history.location.pathname).toBe(`${prefix}${path}`);
  expect(router.state.location.hash).toBe(hash);
  expect(history.length).toBe(2); // A redirect replaces the bookmark, so Back still leaves it.
  expect(router.state.matches.at(-1)?.status).toBe('success');
  if (oldPath.includes('/lesson/')) {
    expect(router.state.matches.at(-1)?.loaderData).toMatchObject({ id: LESSONS[0].id });
  }
  if (oldPath.includes('?')) {
    expect(router.state.matches.at(-1)?.search).toMatchObject({ count: '12', names: 'short' });
  }
});

it('keeps category routes and rejects unknown or malformed legacy exercise paths', async () => {
  for (const pathname of ['/exercises/intervals', '/exercises/not-an-exercise', '/exercises/interval-comparison/custom/extra']) {
    const history = createMemoryHistory({ initialEntries: [pathname] });
    const router = createRouter({ routeTree, history, isServer: false, origin: 'http://localhost' });
    await router.load();
    expect(history.location.pathname).toBe(pathname);
    if (pathname === '/exercises/intervals') {
      expect(router.state.matches.at(-1)?.status).toBe('success');
    } else {
      // The root owns the Not Found boundary; its child need not finish loading.
      expect(isNotFound(router.state.matches.find(match => match.routeId === '__root__')?.error)).toBe(true);
    }
  }
});
