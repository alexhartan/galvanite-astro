const FADE_VIEWPORTS = 0.5;

export const fadeAt = (section: HTMLElement) =>
  Number(section.style.getPropertyValue('--fade') || 1);

export function initFade(section: HTMLElement) {
  let frame = 0;
  const update = () => {
    frame = 0;
    const box = section.getBoundingClientRect();
    const height = window.innerHeight;
    const fade =
      box.top > height
        ? 0
        : Math.min(
            1,
            Math.max(0, 1 - (height - box.bottom) / (height * FADE_VIEWPORTS)),
          );
    section.style.setProperty('--fade', fade.toFixed(3));
    section.dispatchEvent(new Event('fade'));
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
