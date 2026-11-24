export function initParallax(
  element: HTMLElement,
  rate: number,
  fromEnter = false,
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frameElement = element.parentElement ?? element;
  let frame = 0;
  const update = () => {
    frame = 0;
    if (reduced.matches) {
      element.style.setProperty('--shift', '0px');
      return;
    }
    const box = frameElement.getBoundingClientRect();
    const offset = fromEnter
      ? Math.min(0, box.top - window.innerHeight) * rate
      : (box.top + box.height / 2 - window.innerHeight / 2) * rate;
    element.style.setProperty('--shift', `${(-offset).toFixed(1)}px`);
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
