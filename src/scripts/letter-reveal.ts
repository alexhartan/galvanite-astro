const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const OMEGA = 5;

export function initReveal(element: HTMLElement) {
  const section = element.closest('section');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let target = 0;
  let position = 0;
  let velocity = 0;
  let last = 0;
  let frame = 0;
  const measure = () => {
    const height = window.innerHeight;
    const top = section.getBoundingClientRect().top;
    const start = height * 0.75;
    target = ease(Math.min(1, Math.max(0, (start - top) / start)));
  };
  const paint = () => element.style.setProperty('--p', position.toFixed(4));
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    velocity +=
      (OMEGA * OMEGA * (target - position) - 2 * OMEGA * velocity) * dt;
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
  const schedule = () => {
    measure();
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  measure();
  position = target;
  paint();
}
