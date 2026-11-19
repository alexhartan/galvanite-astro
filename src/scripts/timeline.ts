const PLAY_S = 2.8;
const RESET_S = 0.5;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function initTimeline(root: HTMLElement) {
  const stages = [...root.querySelectorAll<HTMLElement>('[data-stage]')];
  const trigger = root.closest<HTMLElement>('[data-process]') ?? root;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let position = 0;
  let from = 0;
  let to = 0;
  let duration = 1;
  let start = 0;
  let frame = 0;

  const paint = () => {
    root.style.setProperty('--p', position.toFixed(4));
    stages.forEach((stage) =>
      stage.toggleAttribute(
        'data-complete',
        position >= Number(stage.dataset.end) - 0.0005,
      ),
    );
  };

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / 1000 / duration);
    position = from + (to - from) * ease(t);
    paint();
    frame = t < 1 ? requestAnimationFrame(step) : 0;
  };

  const tween = (target: number, seconds: number, reset = false) => {
    if (reset) position = 0;
    from = position;
    to = target;
    duration = seconds;
    start = performance.now();
    if (!frame) frame = requestAnimationFrame(step);
  };

  const play = (on: boolean) => {
    root.toggleAttribute('data-playing', on);
    if (on) tween(1, PLAY_S, true);
    else tween(0, RESET_S);
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
