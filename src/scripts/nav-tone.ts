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
    nav.toggleAttribute('data-light', section?.dataset.tone === 'light');
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
