/**
 * Keeps the app hidden until its first screen can appear whole: the table and every sheet with their
 * artwork drawn (elder-scrolls sets data-surface and data-theme once texture and rolls are in place)
 * and every face its text needs. Sheets and text that arrive later wait on their own (SheetLayout,
 * styles/surfaces.css). CSS shows the app anyway after a cap, which also ends the wait here.
 */
export function holdFirstPaint(root: HTMLElement): Promise<void> {
  root.dataset.firstPaint = 'pending';
  let waiting = true;
  let shown: () => void;
  const revealed = new Promise<void>(resolve => { shown = resolve; });
  const capped = (event: AnimationEvent) => { if (event.target === root) reveal(); };
  const reveal = () => {
    waiting = false;
    delete root.dataset.firstPaint;
    root.removeEventListener('animationend', capped);
    shown();
  };
  root.addEventListener('animationend', capped);
  const check = () => {
    if (!waiting) return;
    // Laying out what has rendered requests the faces its text needs.
    root.getBoundingClientRect();
    const whole = root.querySelector('.es-table[data-surface]') && root.querySelector('.paper-content')
      && !root.querySelector('.es-parchment:not([data-theme])') && document.fonts.status === 'loaded';
    if (whole) reveal();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
  return revealed;
}

export function whenIdle(task: () => void): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(task, { timeout: 3000 });
  else setTimeout(task, 1500);
}

let showFirstScreen = () => {};
const firstScreen = new Promise<void>(resolve => { showFirstScreen = resolve; });

/** Called by src/main.tsx once the first screen is shown and its artwork has arrived. */
export function firstScreenShown(): void {
  showFirstScreen();
}

/**
 * Runs `task` once the first screen is shown, its artwork has arrived and the browser is idle, so work
 * for later (another page's paper, an instrument's samples, content below the fold) never competes
 * with what the reader is waiting for. After that moment, a task runs at the next idle one.
 */
export function afterFirstScreen(task: () => void): void {
  void firstScreen.then(() => whenIdle(task));
}

/** The longest speculative work waits for near content, so a stalled download never holds it back. */
const NEAR_CONTENT_CAP_MS = 5000;
const nearContent = new Set<Promise<unknown>>();

/**
 * Runs `prepare` (the downloads of content just below the fold) at the first `afterFirstScreen`
 * moment, ahead of speculative work: `afterNearContent` tasks wait for it to settle. Register it
 * when that content mounts, which is before the first screen is shown.
 */
export function prepareNearContent(prepare: () => Promise<unknown>): Promise<unknown> {
  const work = new Promise<unknown>((resolve, reject) => afterFirstScreen(() => { prepare().then(resolve, reject); }));
  const settled = work.then(() => {}, () => {});
  nearContent.add(settled);
  void settled.then(() => nearContent.delete(settled));
  return work;
}

/**
 * Runs speculative `task`s (another page's paper, every initial letter, instrument samples, warmed
 * images) after the first screen, once the content just below it is prepared (or after a cap) and
 * the browser is idle, so on a slow link they never starve what the reader reaches next. A page with
 * no such content runs them at the first idle moment after its first screen.
 */
export function afterNearContent(task: () => void): void {
  afterFirstScreen(() => {
    const cap = new Promise(resolve => setTimeout(resolve, NEAR_CONTENT_CAP_MS));
    void Promise.race([Promise.all(nearContent), cap]).then(() => whenIdle(task));
  });
}
