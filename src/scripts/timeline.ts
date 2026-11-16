const SNAP_PX = 6;

export function initTimeline(root: HTMLElement) {
  const tooltip = root.querySelector<HTMLElement>('[data-tooltip]');
  const stages = [...root.querySelectorAll<HTMLElement>('[data-stage]')];
  const weeks = Number(getComputedStyle(root).getPropertyValue('--weeks')) || 8;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let position = 0.5;
  let target = 0.5;
  let hovering = false;
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
    const show = hovering && near && week > 0 && week < weeks;
    if (show) root.style.setProperty('--tip', String(week));
    tooltip?.toggleAttribute('data-visible', show);
  };

  const step = () => {
    frame = 0;
    const ease = reduced ? 1 : hovering ? 0.35 : 0.1;
    position += (target - position) * ease;
    if (Math.abs(target - position) < 0.0005) position = target;
    paint();
    if (position !== target) frame = requestAnimationFrame(step);
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(step);
  };

  root.addEventListener('pointermove', (event) => {
    const box = root.getBoundingClientRect();
    hovering = true;
    target = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    schedule();
  });
  root.addEventListener('pointerleave', () => {
    hovering = false;
    target = 0.5;
    schedule();
  });
  paint();
}
