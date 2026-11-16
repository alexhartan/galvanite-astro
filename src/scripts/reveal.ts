const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function initReveal(element: HTMLElement) {
  const section = element.closest('section');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const height = window.innerHeight;
    const top = section.getBoundingClientRect().top;
    const start = height * 0.75;
    const progress = Math.min(1, Math.max(0, (start - top) / start));
    element.style.setProperty('--p', ease(progress).toFixed(4));
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
