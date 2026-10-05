// Explicit package assets work in development and under the Pages deployment base.
import captureWorkletUrl from '@polyhymnia/audio-input/capture-worklet.js?url&no-inline';
import onsetWorkerUrl from '@polyhymnia/audio-analysis/onset-worker.js?url&no-inline';
import pitchWorkerUrl from '@polyhymnia/audio-analysis-pitchy/pitch-worker.js?url&no-inline';

export { captureWorkletUrl, onsetWorkerUrl, pitchWorkerUrl };
