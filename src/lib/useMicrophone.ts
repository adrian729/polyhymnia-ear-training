import { useCallback, useEffect, useRef, useState } from 'react';
import { createMicrophoneSession, type MicrophoneSession } from '@polyhymnia/audio-input/browser';
import { createAudioContext, setAudioSessionPolicy } from '@polyhymnia/web-audio/webaudio';
import { captureWorkletUrl } from './audioInputAssets';

export interface MicrophoneResource {
  context: AudioContext;
  session: MicrophoneSession;
  /** Consumer handoff waits for an earlier capture's drain, retaining explicit activation. */
  captureIdle: Promise<void>;
}
type MicrophoneState = { status: 'off'; error?: string } | { status: 'preparing' } |
  { status: 'enabled'; resource: MicrophoneResource };

/** App ownership: permission only on activation; borrowed playback context stays open. */
export function useMicrophone(onRelease: () => void) {
  const [state, setState] = useState<MicrophoneState>({ status: 'off' });
  const current = useRef<{ session: MicrophoneSession; restore: () => void } | undefined>(undefined);
  const revision = useRef(0);
  const releaseCallback = useRef(onRelease);
  releaseCallback.current = onRelease;
  const release = useCallback(() => {
    revision.current++;
    const previous = current.current; current.current = undefined;
    // Stop the consumer before disposing capture and restoring the global policy.
    if (previous) releaseCallback.current();
    previous?.session.dispose(); previous?.restore();
  }, []);
  const disable = useCallback(() => { release(); setState({ status: 'off' }); }, [release]);
  const fail = useCallback((error: string) => { release(); setState({ status: 'off', error }); }, [release]);
  const activate = async () => {
    release(); setState({ status: 'preparing' });
    const token = revision.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone input needs a supported browser on HTTPS or localhost.');
      const policy = setAudioSessionPolicy('play-and-record');
      try {
        const context = createAudioContext();
        const session = createMicrophoneSession({ context, workletUrl: captureWorkletUrl,
          onFault(reason) { if (revision.current === token) fail(reason); } });
        current.current = { session, restore: policy.restore };
        await session.prepare();
        if (revision.current !== token) { session.dispose(); return; }
        setState({ status: 'enabled', resource: { context, session, captureIdle: Promise.resolve() } });
      } catch (reason) { if (!current.current) policy.restore(); throw reason; }
    } catch (reason) {
      if (revision.current === token) {
        fail(reason instanceof Error ? reason.message : 'Unable to activate microphone.');
      }
    }
  };
  useEffect(() => {
    const hidden = () => { if (document.hidden) disable(); };
    window.addEventListener('pagehide', disable);
    document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('pagehide', disable); document.removeEventListener('visibilitychange', hidden); disable(); };
  }, [disable]);
  return { resource: state.status === 'enabled' ? state.resource : undefined,
    preparing: state.status === 'preparing', error: state.status === 'off' ? state.error : undefined,
    activate, disable, fail };
}
