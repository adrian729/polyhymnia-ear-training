import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';

vi.mock('@/components/lesson/ExerciseMasthead', () => ({
  ExerciseMasthead: () => <a href="/">Index</a>,
}));

it.each([1, 3])('lists sections rather than individual lessons in the sidebar (%i sections)', (count) => {
  const modules = Array.from({ length: count }, (_, index) => ({ id: `section-${index}`, title: `Section ${index + 1}`, help: [] }));
  const lessons = Array.from({ length: count }, (_, index) => ({ id: `pattern-${index}`, title: `Pattern ${index + 1}` }));
  const html = renderToStaticMarkup(<WorkshopPage
    title="Rhythm Reading" blurb="Read and tap a rhythm." overview={[]}
    modules={modules}
    lessonsForModule={() => lessons} getLessonResult={() => undefined} soundControls={null}
    renderLessonLink={(id, className, children) => <a href={`/lesson/${id}`} className={className}>{children}</a>}
  />);
  const sidebar = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
  const targets = [...sidebar.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  expect([...new Set(targets)]).toEqual(modules.map(module => module.id));
  for (const target of targets) expect(html).toContain(`id="${target}"`);
  for (const module of modules) expect(sidebar).toContain(module.title);
  for (const lesson of lessons) expect(sidebar).not.toContain(lesson.title);
});
