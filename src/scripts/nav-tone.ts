import { fadeAt } from './fade';

export function initNavTone(nav: HTMLElement) {
  const logo = nav.querySelector<HTMLElement>('[data-nav-logo]');
  if (!logo) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const box = logo.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const section = document
      .elementsFromPoint(window.innerWidth / 2, y)
      .map((element) => element.closest('section'))
      .find(Boolean);
    const fade = document.querySelector<HTMLElement>('[data-fade]');
    const below = fade && y > fade.getBoundingClientRect().top;
    const light =
      fade && below && fadeAt(fade) < 1
        ? fadeAt(fade) > 0.5
        : section?.dataset.tone === 'light';
    nav.toggleAttribute('data-light', light);
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  document.querySelector('[data-fade]')?.addEventListener('fade', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
