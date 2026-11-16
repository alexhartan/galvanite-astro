import EmblaCarousel from 'embla-carousel';
import { autoplay } from './autoplay';

const AUTOPLAY_MS = 10000;

export function initTestimonials(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-viewport]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!viewport || !prev || !next) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const embla = EmblaCarousel(viewport, {
    align: 'start',
    loop: true,
    duration: reduced ? 1 : 32,
  });
  prev.addEventListener('click', () => embla.scrollPrev());
  next.addEventListener('click', () => embla.scrollNext());
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') embla.scrollPrev();
    if (event.key === 'ArrowRight') embla.scrollNext();
  });
  autoplay(embla, root, AUTOPLAY_MS);
}
