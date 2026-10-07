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
