import { autoplay } from './autoplay';

const AUTOPLAY_MS = 10000;
const SWIPE_PX = 50;
const WHEEL_PX = 40;
const WHEEL_LOCK_MS = 700;

export function initTestimonials(root: HTMLElement) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const total = cards.length;
  if (total < 2) return;
  let current = 0;
  const position = (index: number) => {
    const offset = (index - current + total) % total;
    if (offset === 0) return 'active';
    if (offset === 1) return 'next';
    if (offset === total - 1) return 'prev';
    return 'hidden';
  };
  const show = (index: number) => {
    current = (index + total) % total;
    cards.forEach((card, i) => {
      const pos = position(i);
      card.dataset.pos = pos;
      card.inert = pos === 'hidden';
      const content = card.querySelector<HTMLElement>('[data-content]');
      if (content) content.inert = pos !== 'active';
      const go = card.querySelector<HTMLButtonElement>('[data-go]');
      if (!go) return;
      go.hidden = pos !== 'prev' && pos !== 'next';
      go.setAttribute(
        'aria-label',
        pos === 'prev' ? 'Previous testimonial' : 'Next testimonial',
      );
    });
    restart();
  };
  const restart = autoplay(root, AUTOPLAY_MS, () => show(current + 1));
  cards.forEach((card) =>
    card.querySelector('[data-go]')?.addEventListener('click', () => {
      if (card.dataset.pos === 'prev') show(current - 1);
      if (card.dataset.pos === 'next') show(current + 1);
    }),
  );
  let startX = 0;
  let startY = 0;
  let swiped = false;
  root.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
    swiped = false;
  });
  root.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX;
    if (
      Math.abs(dx) < SWIPE_PX ||
      Math.abs(dx) < Math.abs(event.clientY - startY)
    )
      return;
    swiped = true;
    show(current + (dx < 0 ? 1 : -1));
  });
  root.addEventListener(
    'click',
    (event) => {
      if (!swiped) return;
      event.stopPropagation();
      event.preventDefault();
      swiped = false;
    },
    true,
  );
  let wheel = 0;
  let locked = 0;
  root.addEventListener(
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
