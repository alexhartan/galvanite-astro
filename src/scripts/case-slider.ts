import EmblaCarousel from 'embla-carousel';

export function initCaseSlider(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-viewport]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!viewport || !prev || !next) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const embla = EmblaCarousel(viewport, {
    align: 'start',
    containScroll: 'trimSnaps',
    duration: reduced ? 1 : 32,
  });

  const sync = () => {
    prev.disabled = !embla.canScrollPrev();
    next.disabled = !embla.canScrollNext();
  };

  prev.addEventListener('click', () => embla.scrollPrev());
  next.addEventListener('click', () => embla.scrollNext());
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') embla.scrollPrev();
    if (event.key === 'ArrowRight') embla.scrollNext();
  });
  embla.on('select', sync);
  embla.on('reInit', sync);
  sync();
}
