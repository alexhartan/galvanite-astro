const SNAP_PX = 6;
const DURATION_S = 7;

export function initTimeline(root: HTMLElement) {
  const tooltip = root.querySelector<HTMLElement>('[data-tooltip]');
  const stages = [...root.querySelectorAll<HTMLElement>('[data-stage]')];
  const weeks = Number(getComputedStyle(root).getPropertyValue('--weeks')) || 8;
  const trigger = root.closest<HTMLElement>('[data-process]') ?? root;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let position = 0;
  let playing = false;
  let last = 0;
  let frame = 0;

  const paint = () => {
    root.style.setProperty('--p', position.toFixed(4));
    stages.forEach((stage) =>
      stage.toggleAttribute(
        'data-complete',
        position >= Number(stage.dataset.end) - 0.0005,
      ),
    );
    const week = Math.round(position * weeks);
    const near =
      Math.abs(position * weeks - week) * (root.clientWidth / weeks) < SNAP_PX;
    const show = near && week > 0 && week < weeks;
    if (show) root.style.setProperty('--tip', String(week));
    tooltip?.toggleAttribute('data-visible', show);
    root.toggleAttribute('data-done', position >= 0.995);
  };

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    position = Math.min(1, position + dt / DURATION_S);
    paint();
    frame = playing && position < 1 ? requestAnimationFrame(step) : 0;
  };

  const play = (on: boolean) => {
    playing = on;
    if (!on || frame || position >= 1) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  if (reduced.matches) {
    position = 1;
    paint();
    return;
  }
  trigger.addEventListener('pointerenter', () => hover.matches && play(true));
  trigger.addEventListener('pointerleave', () => hover.matches && play(false));
  trigger.addEventListener('focusin', () => play(true));
  trigger.addEventListener('focusout', () => play(false));
  new IntersectionObserver(
    ([entry]) => {
      if (!hover.matches) play(Boolean(entry?.isIntersecting));
    },
    { threshold: 0.6 },
  ).observe(root);
  paint();
}
