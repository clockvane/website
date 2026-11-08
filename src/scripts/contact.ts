import { contactCopy as copy } from '../content/contact';
import {
  fieldNames,
  validateEnquiry,
  type FieldErrors,
  type FieldName,
} from '../lib/contact/schema';

const root = document.querySelector<HTMLElement>('[data-contact]');
if (root) {
  const form = root.querySelector('form')!;
  const button = form.querySelector('button')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const summary = root.querySelector<HTMLElement>('[data-errors]')!;
  const failure = root.querySelector<HTMLElement>('[data-failure]')!;
  const control = (name: FieldName) =>
    form.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
  const textControls = form.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >('input[data-field], textarea[data-field]');
  const serviceGroup = control('service') as HTMLFieldSetElement;
  const started = form.elements.namedItem('started') as HTMLInputElement;
  started.value = String(Date.now());
  form.noValidate = true;
  let busy = false;
  const values = () => Object.fromEntries(new FormData(form));
  const showField = (name: FieldName, message?: string) => {
    const error = root.querySelector<HTMLElement>(`#${name}-error`)!;
    error.textContent = message ? `! ${message}` : '';
    error.hidden = !message;
    control(name).setAttribute('aria-invalid', String(Boolean(message)));
    control(name).setAttribute(
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
  const validateField = (name: FieldName) => {
    if (busy) return;
    const parsed = validateEnquiry(values());
    showField(name, parsed.ok ? undefined : parsed.fields[name]);
  };
  let pointerDown = false;
  document.addEventListener('pointerdown', () => {
    pointerDown = true;
  });
  for (const type of ['pointerup', 'pointercancel'])
    document.addEventListener(type, () => {
      pointerDown = false;
    });
  for (const name of fieldNames)
    control(name).addEventListener('focusout', (event) => {
      // Moving between the radios of one group is not leaving the field.
      if (control(name).contains(event.relatedTarget as Node | null)) return;
      // A message appearing mid-press moves what is under the pointer and the
      // click misses, so wait until the press has finished.
      if (pointerDown)
        document.addEventListener(
          'pointerup',
          () => setTimeout(() => validateField(name)),
          { once: true },
        );
      else validateField(name);
    });
  serviceGroup.addEventListener('change', () => validateField('service'));
  const setBusy = (value: boolean) => {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    button.setAttribute('aria-disabled', String(value));
    button.textContent = value ? copy.sending : copy.send;
    for (const field of textControls) field.readOnly = value;
    // Radios have no read-only state. Disabling drops them from FormData, so
    // the request body is built before this runs.
    serviceGroup.disabled = value;
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
    const body = new URLSearchParams(
      [...new FormData(form)].map(([name, value]) => [name, String(value)]),
    );
    setBusy(true);
    let failureMessage = copy.failure;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
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
