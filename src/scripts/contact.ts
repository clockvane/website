import { contactCopy as copy } from '../content/contact';
import {
  fieldNames,
  validateEnquiry,
  type FieldErrors,
} from '../lib/contact/schema';

const root = document.querySelector<HTMLElement>('[data-contact]');
if (root) {
  const form = root.querySelector('form')!;
  const button = form.querySelector('button')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const summary = root.querySelector<HTMLElement>('[data-errors]')!;
  const failure = root.querySelector<HTMLElement>('[data-failure]')!;
  const controls = fieldNames.map(
    (name) =>
      form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement,
  );
  const started = form.elements.namedItem('started') as HTMLInputElement;
  started.value = String(Date.now());
  form.noValidate = true;
  let busy = false;
  const values = () => Object.fromEntries(new FormData(form));
  const showField = (name: (typeof fieldNames)[number], message?: string) => {
    const control = controls.find((control) => control.name === name)!;
    const error = root.querySelector<HTMLElement>(`#${name}-error`)!;
    error.textContent = message ? `! ${message}` : '';
    error.hidden = !message;
    control.setAttribute('aria-invalid', String(Boolean(message)));
    control.setAttribute(
      'aria-describedby',
      `${name}-hint${message ? ` ${name}-error` : ''}`,
    );
  };
  const showErrors = (fields: FieldErrors) => {
    const list = summary.querySelector('ul')!;
    list.replaceChildren();
    for (const name of fieldNames) {
      showField(name, fields[name]);
      if (!fields[name]) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#contact-${name}`;
      link.textContent = fields[name];
      item.append(link);
      list.append(item);
    }
    summary.hidden = false;
    summary.focus();
  };
  for (const control of controls)
    control.addEventListener('blur', () => {
      const parsed = validateEnquiry(values());
      showField(
        control.name as (typeof fieldNames)[number],
        parsed.ok
          ? undefined
          : parsed.fields[control.name as (typeof fieldNames)[number]],
      );
    });
  const setBusy = (value: boolean) => {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    button.setAttribute('aria-disabled', String(value));
    button.textContent = value ? copy.sending : copy.send;
    for (const control of controls) control.readOnly = value;
    status.textContent = value ? copy.sendingStatus : '';
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    failure.hidden = true;
    summary.hidden = true;
    const parsed = validateEnquiry(values());
    if (!parsed.ok) {
      showErrors(parsed.fields);
      return;
    }
    for (const name of fieldNames) showField(name);
    setBusy(true);
    let failureMessage = copy.failure;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(
          [...new FormData(form)].map(([name, value]) => [name, String(value)]),
        ),
        credentials: 'omit',
        signal: AbortSignal.timeout(15_000),
      });
      const result: unknown = await response.json();
      if (
        response.ok &&
        typeof result === 'object' &&
        result !== null &&
        'ok' in result &&
        result.ok === true
      ) {
        setBusy(false);
        root.querySelector<HTMLElement>('[data-contact-fields]')!.hidden = true;
        const success = root.querySelector<HTMLElement>(
          '[data-contact-success]',
        )!;
        success.hidden = false;
        form.reset();
        success.querySelector<HTMLElement>('[data-result-heading]')!.focus();
        return;
      }
      if (
        response.status === 400 &&
        typeof result === 'object' &&
        result !== null &&
        'fields' in result &&
        typeof result.fields === 'object' &&
        result.fields !== null
      ) {
        const fields: FieldErrors = {};
        for (const name of fieldNames) {
          const value = (result.fields as Record<string, unknown>)[name];
          if (typeof value === 'string') fields[name] = value;
        }
        if (Object.keys(fields).length) {
          setBusy(false);
          showErrors(fields);
          return;
        }
      }
      if (response.status === 429) failureMessage = copy.rate;
      else if (response.status === 400) failureMessage = copy.spam;
    } catch {
      if (!navigator.onLine) failureMessage = copy.offline;
    }
    setBusy(false);
    failure.querySelector<HTMLElement>('[data-failure-message]')!.textContent =
      failureMessage;
    failure.hidden = false;
    failure.focus();
  });
}
