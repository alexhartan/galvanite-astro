import { autoplay } from './autoplay';

const AUTOPLAY_MS = 10000;
const SWIPE_PX = 50;
const WHEEL_PX = 40;
const WHEEL_LOCK_MS = 700;

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
  const track = pages[0]?.parentElement;
  let startX = 0;
  let startY = 0;
  track?.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  track?.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX;
    if (
      Math.abs(dx) < SWIPE_PX ||
      Math.abs(dx) < Math.abs(event.clientY - startY)
    )
      return;
    show(current + (dx < 0 ? 1 : -1));
  });
  let wheel = 0;
  let locked = 0;
  track?.addEventListener(
    'wheel',
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (event.timeStamp < locked) return;
      wheel += event.deltaX;
      if (Math.abs(wheel) < WHEEL_PX) return;
      show(current + (wheel > 0 ? 1 : -1));
      wheel = 0;
      locked = event.timeStamp + WHEEL_LOCK_MS;
    },
    { passive: false },
  );
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
  restart();
}
