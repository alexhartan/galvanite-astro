import EmblaCarousel from 'embla-carousel';
import { autoplay } from './autoplay';

const AUTOPLAY_MS = 8000;

export function initCaseSlider(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-viewport]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!viewport || !prev || !next) return;
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const embla = EmblaCarousel(viewport, {
    align: 'start',
    loop: true,
    duration: reduced ? 1 : 32,
  });

  const sync = () => {
    const current = embla.selectedScrollSnap();
    const upcoming = (current + 1) % slides.length;
    slides.forEach((slide, index) => {
      slide.toggleAttribute('data-active', index === current);
      slide.toggleAttribute(
        'data-past',
        index !== current && index !== upcoming,
      );
      slide.setAttribute('aria-hidden', String(index !== current));
    });
    panels.forEach((panel, index) => {
      panel.toggleAttribute('data-active', index === current);
      panel.inert = index !== current;
    });
  };

  prev.addEventListener('click', () => embla.scrollPrev());
  next.addEventListener('click', () => embla.scrollNext());
  slides.forEach((slide, index) =>
    slide.addEventListener('click', () => {
      if (index !== embla.selectedScrollSnap()) embla.scrollTo(index);
    }),
  );
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') embla.scrollPrev();
    if (event.key === 'ArrowRight') embla.scrollNext();
  });
  embla.on(
    'select',
    autoplay(root, AUTOPLAY_MS, () => embla.scrollNext()),
  );
  embla.on('select', sync);
  embla.on('reInit', sync);
  sync();
}
