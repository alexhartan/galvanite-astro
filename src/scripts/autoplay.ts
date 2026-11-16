import type { EmblaCarouselType } from 'embla-carousel';

export function autoplay(
  embla: EmblaCarouselType,
  root: HTMLElement,
  delay: number,
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;
  let paused = false;
  let visible = false;
  const start = () => {
    window.clearTimeout(timer);
    if (reduced || paused || !visible || document.hidden) return;
    timer = window.setTimeout(() => embla.scrollNext(), delay);
  };
  const pause = (value: boolean) => {
    paused = value;
    start();
  };
  root.addEventListener('mouseenter', () => pause(true));
  root.addEventListener('mouseleave', () => pause(false));
  root.addEventListener('focusin', (event) => {
    if ((event.target as Element).matches(':focus-visible')) pause(true);
  });
  root.addEventListener('focusout', () => pause(false));
  document.addEventListener('visibilitychange', start);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(root);
  embla.on('select', start);
  start();
}
