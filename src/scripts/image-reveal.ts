export function initImageReveal(root: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (root.getBoundingClientRect().top < window.innerHeight) return;
  root.dataset.revealState = 'hidden';
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      root.dataset.revealState = 'shown';
      observer.disconnect();
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  observer.observe(root);
}
