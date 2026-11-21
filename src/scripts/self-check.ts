const points: Record<string, number> = { standard: 1, featured: 2, premium: 3 };
for (const root of document.querySelectorAll<HTMLElement>(
  '[data-self-check]',
)) {
  const inputs = [
    ...root.querySelectorAll<HTMLInputElement>('input[data-tier]'),
  ];
  const update = () => {
    const checked = inputs.filter((i) => i.checked);
    const score = checked.reduce(
      (sum, i) => sum + (points[i.dataset.tier!] ?? 0),
      0,
    );
    if (!checked.length) delete root.dataset.pick;
    else
      root.dataset.pick =
        score >= 6 ? 'brand' : score >= 3 ? 'upper' : 'sprint';
  };
  root.addEventListener('change', update);
  update();
}
