const RATE = 1.6;
const SMOOTHING = 5;
const GAP = 32;
const ease = (t: number) => t * t * (3 - 2 * t);

export function initCaseScroll(root: HTMLElement) {
  const sticky = root.querySelector<HTMLElement>('[data-sticky]');
  const track = root.querySelector<HTMLElement>('[data-track]');
  if (!sticky || !track) return;
  const slides = [...track.querySelectorAll<HTMLElement>('[data-slide]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let distance = 0;
  let range = 0;
  let offset = 0;
  let target = 0;
  let position = 0;
  let last = 0;
  let frame = 0;

  const paint = () =>
    track.style.setProperty('--x', `${(-position * distance).toFixed(2)}px`);
  const measure = () => {
    const end = slides.at(-1);
    distance = end
      ? Math.max(0, end.offsetLeft + end.offsetWidth - track.clientWidth)
      : 0;
    range = distance * RATE;
    root.style.setProperty(
      '--scroll-height',
      `${sticky.offsetHeight + range}px`,
    );
    root.style.removeProperty('--sticky-top');
    const nav = parseFloat(getComputedStyle(sticky).top) || 0;
    offset = Math.min(nav + GAP, window.innerHeight - sticky.offsetHeight - GAP);
    root.style.setProperty('--sticky-top', `${offset}px`);
  };
  const read = () => {
    const top = root.getBoundingClientRect().top;
    target = range ? ease(Math.min(1, Math.max(0, (offset - top) / range))) : 0;
  };
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    position += (target - position) * (1 - Math.exp(-SMOOTHING * dt));
    if (Math.abs(target - position) < 0.0005) {
      position = target;
      frame = 0;
    } else {
      frame = requestAnimationFrame(step);
    }
    paint();
  };
  const update = () => {
    read();
    if (reduced.matches) {
      position = target;
      paint();
      return;
    }
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };
  const resize = () => {
    measure();
    update();
  };

  slides.forEach((slide, index) =>
    slide.addEventListener('focusin', () => {
      const box = slide.getBoundingClientRect();
      if (box.left >= 0 && box.right <= window.innerWidth) return;
      const progress = index === 0 ? 0 : 1;
      const scroll = window.scrollY + root.getBoundingClientRect().top - offset;
      window.scrollTo({ top: scroll + progress * range });
    }),
  );
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  measure();
  read();
  position = target;
  paint();
}
