import { createOnsetWorker } from '@polyhymnia/audio-analysis/browser';
import { frameToPerformanceTime, type CaptureClock } from '@polyhymnia/audio-input/browser';
import type { ExternalInputSource, ExternalInputStart } from '@polyhymnia/rhythm/browser';
import type { MicrophoneResource } from './useMicrophone';
import { onsetWorkerUrl } from './audioInputAssets';
import type { TimingPreferences } from '@/exercises/shared/rhythm/store';

/** Composition only: detection, capture and timing assessment stay in their packages. */
export function createClapInput(resource: MicrophoneResource, options: {
  settings: TimingPreferences['microphone']; onClap: () => void; onRelease: () => void;
}): ExternalInputSource {
  let clock: CaptureClock;
  let worker: ReturnType<typeof createOnsetWorker>;
  let startOptions: ExternalInputStart | undefined;
  let closed = false;
  const epochId = `claps-${crypto.randomUUID()}`;
  return {
    id: 'microphone', offsetMs: options.settings.offsetMs, maximumDeliveryAgeMs: 1000, drainTimeoutMs: 1500,
    async prepare(signal) {
      if (signal.aborted || !resource.session.ready) throw new Error('Activate the microphone before starting.');
      worker = createOnsetWorker({ epochId, generation: epochId, sampleRate: resource.context.sampleRate,
        workerUrl: onsetWorkerUrl,
        analysisOptions: { minimumRms: options.settings.minimumRms, riseRatio: options.settings.riseRatio,
          minimumSpacingMs: options.settings.minimumSpacingMs },
        onFault: reason => { if (!closed) { closed = true; startOptions?.interrupt(reason); } },
        onObservations(batch) {
          const start = startOptions;
          if (closed || !start) return;
          for (const observation of batch.observations) {
            const timestamp = frameToPerformanceTime(clock, observation.frame);
            if (timestamp >= start.eligibilityStartPerformanceMs && timestamp < start.eligibilityEndPerformanceMs) {
              start.emit({ generation: start.generation, eventId: `${epochId}:${observation.frame}`, performanceTimeMs: timestamp });
              options.onClap();
            }
          }
        } });
      // Download/init the worker before timed playback, and clean up cancelled readiness.
      signal.addEventListener('abort', () => { closed = true; worker.dispose(); }, { once: true });
      try {
        await worker.ready;
        if (signal.aborted) throw new Error('Microphone preparation cancelled.');
        clock = await resource.session.clock();
        if (signal.aborted) throw new Error('Microphone preparation cancelled.');
      } catch (reason) { closed = true; worker.dispose(); throw reason; }
    },
    start(start) {
      if (closed || !clock || !worker) throw new Error('Prepare microphone analysis before starting.');
      startOptions = start;
      const end = Math.ceil((start.eligibilityEndPerformanceMs - clock.performanceOriginMs) * clock.sampleRate / 1000);
      const tail = end + Math.ceil(clock.sampleRate * .020);
      let drained = false;
      try {
        resource.session.start({ epochId, clock, maximumClockDeviationMs: Math.max(25, clock.uncertaintyMs + 10),
          onChunk: chunk => worker.push(chunk.samples, chunk.startFrame) });
      } catch (reason) { worker.dispose(); throw reason; }
      return {
        async drain() {
          await worker.setCutoff(end);
          await resource.session.finish(end, tail);
          await worker.finish(end); drained = true;
        },
        cancel() {
          closed = true; worker.dispose();
          if (!drained) { resource.session.cancel(); options.onRelease(); }
        },
      };
    },
  };
}
