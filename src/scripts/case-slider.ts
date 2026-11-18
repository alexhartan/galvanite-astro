import EmblaCarousel from 'embla-carousel';

export function initCaseSlider(root: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>('[data-viewport]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  if (!viewport || !prev || !next) return;
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const embla = EmblaCarousel(viewport, {
    align: 'start',
    containScroll: 'trimSnaps',
    duration: reduced ? 1 : 32,
  });

  const peek = () => {
    const edge = document.documentElement.clientWidth;
    slides.forEach((slide) => {
      const box = slide.getBoundingClientRect();
      const partial = box.right > edge + 1 || box.left < -1;
      slide.toggleAttribute('data-peek', partial);
      slide.setAttribute('aria-hidden', String(partial));
    });
  };
  const sync = () => {
    prev.disabled = !embla.canScrollPrev();
    next.disabled = !embla.canScrollNext();
    peek();
  };

  prev.addEventListener('click', () => embla.scrollPrev());
  next.addEventListener('click', () => embla.scrollNext());
  slides.forEach((slide, index) =>
    slide.addEventListener('click', (event) => {
      if (!slide.hasAttribute('data-peek')) return;
      event.preventDefault();
      embla.scrollTo(Math.min(index, embla.scrollSnapList().length - 1));
    }),
  );
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') embla.scrollPrev();
    if (event.key === 'ArrowRight') embla.scrollNext();
  });
  embla.on('select', sync);
  embla.on('scroll', peek);
  embla.on('settle', peek);
  embla.on('reInit', sync);
  sync();
}
