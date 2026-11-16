import { autoplay } from './autoplay';

const AUTOPLAY_MS = 10000;

export function initTestimonials(root: HTMLElement) {
  const pages = [...root.querySelectorAll<HTMLElement>('[data-page]')];
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!prev || !next || pages.length < 2) return;
  let current = 0;
  const show = (index: number) => {
    current = (index + pages.length) % pages.length;
    pages.forEach((page, i) => {
      page.toggleAttribute('data-active', i === current);
      page.inert = i !== current;
    });
    restart();
  };
  const restart = autoplay(root, AUTOPLAY_MS, () => show(current + 1));
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  restart();
}
