const SNAP_PX = 6;
const OMEGA = 6;
const MAX_SPEED = 0.4;

export function initTimeline(root: HTMLElement) {
  const tooltip = root.querySelector<HTMLElement>('[data-tooltip]');
  const stages = [...root.querySelectorAll<HTMLElement>('[data-stage]')];
  const weeks = Number(getComputedStyle(root).getPropertyValue('--weeks')) || 8;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0;
  let velocity = 0;
  let target = 0;
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
    root.toggleAttribute('data-done', position >= 1);
  };

  const scrolled = () => {
    const box = root.getBoundingClientRect();
    const start = window.innerHeight;
    const bottom =
      document.documentElement.scrollHeight -
      window.innerHeight -
      window.scrollY;
    const end = Math.max(
      window.innerHeight / 2 - box.height / 2,
      box.top - bottom,
    );
    const value = (start - box.top) / (start - end);
    return value > 0.998 ? 1 : Math.max(0, value);
  };

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    velocity +=
      (OMEGA * OMEGA * (target - position) - 2 * OMEGA * velocity) * dt;
    velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity));
    position += velocity * dt;
    if (Math.abs(target - position) < 0.0005 && Math.abs(velocity) < 0.001) {
      position = target;
      velocity = 0;
      frame = 0;
    } else {
      frame = requestAnimationFrame(step);
    }
    paint();
  };

  const follow = () => {
    target = scrolled();
    if (reduced.matches) {
      position = target;
      paint();
      return;
    }
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow, { passive: true });
  position = target = scrolled();
  paint();
}
