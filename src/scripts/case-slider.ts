import EmblaCarousel from 'embla-carousel';

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

  let timer = 0;
  let paused = false;
  let visible = false;
  const stop = () => window.clearTimeout(timer);
  const start = () => {
    stop();
    if (reduced || paused || !visible || document.hidden) return;
    timer = window.setTimeout(() => embla.scrollNext(), AUTOPLAY_MS);
  };
  const pause = (value: boolean) => () => {
    paused = value;
    start();
  };

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
    start();
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
  root.addEventListener('mouseenter', pause(true));
  root.addEventListener('mouseleave', pause(false));
  root.addEventListener('focusin', (event) => {
    if ((event.target as Element).matches(':focus-visible')) pause(true)();
  });
  root.addEventListener('focusout', pause(false));
  document.addEventListener('visibilitychange', start);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(root);
  embla.on('select', sync);
  embla.on('reInit', sync);
  sync();
}
