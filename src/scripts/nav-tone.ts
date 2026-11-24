import { onScrollFrame } from './env';

export function initNavTone(nav: HTMLElement) {
  const logo = nav.querySelector<HTMLElement>('[data-nav-logo]');
  if (!logo) return;
  onScrollFrame(() => {
    const box = logo.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const section = document
      .elementsFromPoint(window.innerWidth / 2, y)
      .map((element) => element.closest('section'))
      .find(Boolean);
    nav.toggleAttribute('data-light', section?.dataset.tone === 'light');
  });
}
