import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useMicrophone } from '@/lib/useMicrophone';

type Microphone = ReturnType<typeof useMicrophone>;
const Context = createContext<{ microphone: Microphone; subscribe: (release: () => void) => () => void } | undefined>(undefined);

/** The root keys this owner by exercise group. Activation survives practice navigation within that group only. */
export function MicrophoneProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<() => void>());
  const microphone = useMicrophone(() => { for (const release of listeners.current) release(); });
  const subscribe = useCallback((release: () => void) => {
    listeners.current.add(release);
    return () => { listeners.current.delete(release); };
  }, []);
  useLayoutEffect(() => () => microphone.disable(), [microphone.disable]);
  return <Context.Provider value={{ microphone, subscribe }}>{children}</Context.Provider>;
}

export function useExerciseMicrophone(onRelease?: () => void) {
  const context = useContext(Context);
  if (!context) throw new Error('Exercise microphone needs its provider.');
  const callback = useRef(onRelease);
  callback.current = onRelease;
  useLayoutEffect(() => context.subscribe(() => callback.current?.()), [context.subscribe]);
  return context.microphone;
}
