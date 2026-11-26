import { reducedMotion } from './env';

const BASE_SPEED = 60;
const SCROLL_BOOST = 0.8;
const SPEED_EASE = 2.5;
const BOOST_DECAY = 1.5;
const DRAG_PX = 5;
const RAMP_MS = 1800;

export function initMarquee(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-track]');
  const slides = track
    ? [...track.querySelectorAll<HTMLElement>('[data-slide]')]
    : [];
  if (!track || slides.length < 2) return;
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let loop = 0;
  let x = 0;
  let speed = 0;
  let rampStart = 0;
  let boost = 0;
  let paused = false;
  let visible = false;
  let last = 0;
  let frame = 0;
  let scrollY = window.scrollY;
  let scrollAt = performance.now();
  let drag: {
    id: number;
    x: number;
    t: number;
    v: number;
    moved: number;
  } | null = null;

  const wrap = () => {
    if (!loop) return;
    while (-x >= loop) x += loop;
    while (x > 0) x -= loop;
  };
  const paint = () => {
    wrap();
    track.style.setProperty('--x', `${x.toFixed(2)}px`);
  };
  const measure = () => {
    const copy = slides[slides.length / 2];
    loop = copy ? copy.offsetLeft - (slides[0]?.offsetLeft ?? 0) : 0;
  };
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (!drag) {
      boost *= Math.exp(-BOOST_DECAY * dt);
      const t = rampStart ? Math.min((now - rampStart) / RAMP_MS, 1) : 0;
      const ramp = t * t * (3 - 2 * t);
      const target =
        paused || reducedMotion.matches
          ? 0
          : BASE_SPEED * ramp * (1 + boost * SCROLL_BOOST);
      speed += (target - speed) * (1 - Math.exp(-SPEED_EASE * dt));
      x -= speed * dt;
      paint();
    }
    frame = visible ? requestAnimationFrame(step) : 0;
  };
  const start = () => {
    if (frame || !visible) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  track.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      t: event.timeStamp,
      v: 0,
      moved: 0,
    };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dt = Math.max(event.timeStamp - drag.t, 1) / 1000;
    drag.moved += Math.abs(dx);
    if (drag.moved > DRAG_PX && !track.hasPointerCapture(drag.id)) {
      track.setPointerCapture(drag.id);
    }
    drag.v = drag.v * 0.6 + (dx / dt) * 0.4;
    drag.x = event.clientX;
    drag.t = event.timeStamp;
    x += dx;
    paint();
  });
  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved > DRAG_PX) {
      speed = -drag.v;
      track.addEventListener(
        'click',
        (click) => {
          click.preventDefault();
          click.stopPropagation();
        },
        { capture: true, once: true },
      );
    }
    drag = null;
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);
  track.addEventListener('dragstart', (event) => event.preventDefault());

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
  track.addEventListener('pointerenter', () => {
    if (hover.matches) paused = true;
  });
  track.addEventListener('pointerleave', () => {
    paused = false;
  });
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));
  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    start();
  }).observe(root);
  measure();
  const startRamp = () => {
    rampStart ||= performance.now();
  };
  setTimeout(() => {
    if (
      root.dataset.revealState !== 'hidden' &&
      root.dataset.revealState !== 'shown'
    )
      return startRamp();
    new MutationObserver((_, observer) => {
      if (root.dataset.revealState !== 'done') return;
      observer.disconnect();
      startRamp();
    }).observe(root, {
      attributes: true,
      attributeFilter: ['data-reveal-state'],
    });
  });
}
