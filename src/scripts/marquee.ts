const BASE_SPEED = 40;
const SCROLL_BOOST = 0.8;
const SPEED_EASE = 2.5;
const BOOST_DECAY = 1.5;

export function initMarquee(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-track]');
  const slides = track
    ? [...track.querySelectorAll<HTMLElement>('[data-slide]')]
    : [];
  if (!track || slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let loop = 0;
  let x = 0;
  let speed = BASE_SPEED;
  let boost = 0;
  let paused = false;
  let visible = false;
  let last = 0;
  let frame = 0;
  let scrollY = window.scrollY;
  let scrollAt = performance.now();

  const measure = () => {
    const copy = slides[slides.length / 2];
    loop = copy ? copy.offsetLeft - (slides[0]?.offsetLeft ?? 0) : 0;
  };
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    boost *= Math.exp(-BOOST_DECAY * dt);
    const target = paused ? 0 : BASE_SPEED * (1 + boost * SCROLL_BOOST);
    speed += (target - speed) * (1 - Math.exp(-SPEED_EASE * dt));
    x -= speed * dt;
    if (loop && -x >= loop) x += loop;
    track.style.setProperty('--x', `${x.toFixed(2)}px`);
    frame = visible ? requestAnimationFrame(step) : 0;
  };
  const start = () => {
    if (frame || !visible) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  window.addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const rate =
        Math.abs(window.scrollY - scrollY) / Math.max(now - scrollAt, 16);
      scrollY = window.scrollY;
      scrollAt = now;
      boost = Math.min(1, Math.max(boost, rate / 2));
    },
    { passive: true },
  );
  window.addEventListener('resize', measure, { passive: true });
  root.addEventListener('pointerenter', () => {
    if (hover.matches) paused = true;
  });
  root.addEventListener('pointerleave', () => {
    paused = false;
  });
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));
  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    start();
  }).observe(root);
  measure();
}
