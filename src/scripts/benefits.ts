export function initBenefits(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const proofs = [...root.querySelectorAll<HTMLElement>('[data-proof]')];
  if (!stage) return;
  const desktop = window.matchMedia('(min-width: 64rem)');
  let frame = 0;

  const update = () => {
    frame = 0;
    let active = 0;
    if (desktop.matches) {
      const slot = stage.getBoundingClientRect().bottom;
      cards.forEach((card, index) => {
        const { top, height } = card.getBoundingClientRect();
        if (top + height / 2 <= slot + height) active = index;
      });
    }
    cards.forEach((card, index) =>
      card.toggleAttribute('data-active', index === active),
    );
    proofs.forEach((proof, index) => {
      proof.toggleAttribute('data-active', index === active);
      proof.inert = index !== active;
    });
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}
