export function splitLines(el: HTMLElement) {
  const text = el.textContent?.trim().replace(/\s+/g, ' ') ?? '';
  if (!text) return;
  el.setAttribute('aria-label', text);
  const build = () => {
    const words = text.split(' ').map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    });
    el.replaceChildren();
    words.forEach((word, index) => {
      el.append(word);
      if (index < words.length - 1) el.append(' ');
    });
    const lines: string[][] = [];
    let top = Number.NaN;
    words.forEach((word) => {
      if (word.offsetTop !== top) {
        top = word.offsetTop;
        lines.push([]);
      }
      lines.at(-1)?.push(word.textContent ?? '');
    });
    el.replaceChildren(
      ...lines.map((line, index) => {
        const mask = document.createElement('span');
        mask.className = 'reveal-line-mask block';
        mask.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.className = 'reveal-line block';
        inner.style.setProperty('--line', String(index));
        inner.textContent = line.join(' ');
        mask.append(inner);
        return mask;
      }),
    );
  };
  build();
  let width = el.clientWidth;
  new ResizeObserver(() => {
    if (el.clientWidth === width) return;
    width = el.clientWidth;
    build();
  }).observe(el);
  document.fonts?.ready.then(build);
}
