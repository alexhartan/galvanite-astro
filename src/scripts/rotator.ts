const INTERVAL_MS = 4500;

export function initRotator(root: HTMLElement) {
  const items = [...root.children] as HTMLElement[];
  if (items.length < 2) return;
  let current = 0;
  setInterval(() => {
    items[current]?.removeAttribute('data-active');
    items[current]?.setAttribute('aria-hidden', 'true');
    current = (current + 1) % items.length;
    items[current]?.setAttribute('data-active', '');
    items[current]?.removeAttribute('aria-hidden');
  }, INTERVAL_MS);
}
