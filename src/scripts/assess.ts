const DOMAIN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function initAssess(
  form: HTMLFormElement,
  dialog: HTMLDialogElement | null,
) {
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
  const report = dialog ? initReport(dialog, url) : null;
  form.addEventListener('submit', (event) => {
    const noIssues = !boxes.some((box) => box.checked);
    const badUrl = !DOMAIN.test(url.value.trim());
    setIssues(noIssues);
    setUrl(badUrl);
    if (!noIssues && !badUrl) {
      if (!report) return;
      event.preventDefault();
      report(
        boxes
          .filter((box) => box.checked)
          .map(
            (box) =>
              box
                .closest('label')
                ?.querySelector('[data-statement]')
                ?.textContent?.trim() ?? '',
          ),
        url.value.trim(),
      );
      return;
    }
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

function initReport(dialog: HTMLDialogElement, url: HTMLInputElement) {
  const list = dialog.querySelector<HTMLElement>('[data-report-issues]');
  const template = dialog.querySelector<HTMLTemplateElement>(
    '[data-report-issue]',
  );
  const website = dialog.querySelector<HTMLElement>('[data-report-website]');
  const email = dialog.querySelector<HTMLInputElement>('[name="email"]');
  dialog
    .querySelector('[data-report-close]')
    ?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-report-edit]')?.addEventListener('click', () => {
    dialog.close();
    url.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  return (statements: string[], site: string) => {
    if (list && template) {
      list.replaceChildren(
        ...statements.map((statement) => {
          const item = template.content.cloneNode(true) as DocumentFragment;
          const text = item.querySelector('li > span:last-child');
          if (text) text.textContent = statement;
          return item;
        }),
      );
    }
    if (website) website.textContent = site.replace(/^https?:\/\//i, '');
    dialog.showModal();
    email?.focus();
  };
}
