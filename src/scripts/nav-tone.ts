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
    let light = section?.dataset.tone === 'light';
    const band = section?.querySelector<HTMLElement>('[data-fade-band]');
    if (light && band) {
      const top = band.getBoundingClientRect().top;
      light = (y - top) / band.offsetHeight < 0.5;
    }
    nav.toggleAttribute('data-light', light);
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
