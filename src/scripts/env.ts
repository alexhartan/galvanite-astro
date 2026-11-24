export const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
);

export function onScrollFrame(callback: () => void) {
  let frame = 0;
  const schedule = () => {
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      callback();
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  callback();
}
