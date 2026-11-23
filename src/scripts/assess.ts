const DOMAIN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function initAssess(form: HTMLFormElement) {
  const issues = form.querySelector<HTMLFieldSetElement>('fieldset');
  const boxes = [...form.querySelectorAll<HTMLInputElement>('[name="issues"]')];
  const url = form.querySelector<HTMLInputElement>('[name="website"]');
  const issuesMessage = form.querySelector<HTMLElement>(
    '[data-issues-message]',
  );
  const urlMessage = form.querySelector<HTMLElement>('[data-url-message]');
  if (!issues || !url || !issuesMessage || !urlMessage) return;
  const setIssues = (error: boolean) => {
    issues.toggleAttribute('data-issues-error', error);
    issuesMessage.hidden = !error;
  };
  const setUrl = (error: boolean) => {
    url.setAttribute('aria-invalid', String(error));
    urlMessage.hidden = !error;
  };
  form.addEventListener('submit', (event) => {
    const noIssues = !boxes.some((box) => box.checked);
    const badUrl = !DOMAIN.test(url.value.trim());
    setIssues(noIssues);
    setUrl(badUrl);
    if (!noIssues && !badUrl) return;
    event.preventDefault();
    (noIssues ? boxes[0] : url)?.focus();
  });
  boxes.forEach((box) =>
    box.addEventListener('change', () => {
      if (boxes.some((item) => item.checked)) setIssues(false);
    }),
  );
  url.addEventListener('input', () => setUrl(false));
}
