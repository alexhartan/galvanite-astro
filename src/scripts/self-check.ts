for (const root of document.querySelectorAll<HTMLElement>(
  '[data-self-check]',
)) {
  const inputs = [
    ...root.querySelectorAll<HTMLInputElement>('input[data-tier]'),
  ];
  const update = () => {
    const tiers = inputs.filter((i) => i.checked).map((i) => i.dataset.tier);
    const count = (tier: string) => tiers.filter((t) => t === tier).length;
    const premium = count('premium');
    const upper = premium + count('featured');
    const n = tiers.length;
    if (!n) delete root.dataset.pick;
    else if (premium >= 2 || n >= 4 || (premium && n >= 3))
      root.dataset.pick = 'brand';
    else root.dataset.pick = upper ? 'upper' : 'sprint';
  };
  root.addEventListener('change', update);
  update();
}
