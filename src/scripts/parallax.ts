import { onScrollFrame, reducedMotion } from './env';

for (const element of document.querySelectorAll<HTMLElement>(
  '[data-parallax]',
)) {
  const rate = Number(element.dataset.parallax) || 0.25;
  const fromEnter = element.dataset.parallaxFrom === 'enter';
  const frame = element.parentElement ?? element;
  onScrollFrame(() => {
    if (reducedMotion.matches) {
      element.style.setProperty('--shift', '0px');
      return;
    }
    const box = frame.getBoundingClientRect();
    const offset = fromEnter
      ? Math.min(0, box.top - window.innerHeight) * rate
      : (box.top + box.height / 2 - window.innerHeight / 2) * rate;
    element.style.setProperty('--shift', `${(-offset).toFixed(1)}px`);
  });
}
