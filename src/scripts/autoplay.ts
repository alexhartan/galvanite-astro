export function autoplay(
  root: HTMLElement,
  delay: number,
  advance: () => void,
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;
  let paused = false;
  let visible = false;
  const restart = () => {
    window.clearTimeout(timer);
    if (reduced || paused || !visible || document.hidden) return;
    timer = window.setTimeout(advance, delay);
  };
  const pause = (value: boolean) => {
    paused = value;
    restart();
  };
  root.addEventListener('mouseenter', () => pause(true));
  root.addEventListener('mouseleave', () => pause(false));
  root.addEventListener('focusin', (event) => {
    if ((event.target as Element).matches(':focus-visible')) pause(true);
  });
  root.addEventListener('focusout', () => pause(false));
  document.addEventListener('visibilitychange', restart);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    restart();
  }).observe(root);
  return restart;
}
