const DONE_MS = 2200;

export function initImageReveal(root: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (root.getBoundingClientRect().top < window.innerHeight) return;
  root.dataset.revealState = 'hidden';
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      root.dataset.revealState = 'shown';
      setTimeout(() => (root.dataset.revealState = 'done'), DONE_MS);
      observer.disconnect();
    },
    { rootMargin: '0px 0px -40% 0px' },
  );
  observer.observe(root);
}
