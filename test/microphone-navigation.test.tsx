import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useExerciseMicrophone } from '@/components/audio/MicrophoneProvider';
import { Route } from '@/routes/__root';

// During navigation, the location changes before the committed Outlet does.
vi.mock('@tanstack/react-router', async importOriginal => ({
  ...await importOriginal<typeof import('@tanstack/react-router')>(),
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) => select({
    location: { pathname: '/' }, matches: [{ routeId: '/exercises/pitch-matching/' }],
  }),
  Outlet: () => createElement(MicrophoneConsumer),
}));

function MicrophoneConsumer() {
  const microphone = useExerciseMicrophone();
  return createElement('span', null, microphone.resource ? 'Enabled' : 'Off');
}

it('keeps the microphone provider while its exercise Outlet is still committed', () => {
  expect(renderToStaticMarkup(createElement(Route.options.component!))).toContain('Off');
});
