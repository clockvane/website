import { describe, expect, it } from 'vitest';
import { validateEnquiry } from '../../../../src/lib/contact/schema';

const valid = {
  name: ' Alex ',
  reply: 'alex@example.test',
  message: 'Please automate our order entry.',
};
describe('enquiry validation', () => {
  it('trims input and accepts email or international phone', () => {
    expect(validateEnquiry(valid)).toEqual({
      ok: true,
      value: { ...valid, name: 'Alex' },
    });
    expect(validateEnquiry({ ...valid, reply: '+91 98765 43210' }).ok).toBe(
      true,
    );
    expect(
      validateEnquiry({
        ...valid,
        message: 'Orders\nneed automation.\nThank you.',
      }).ok,
    ).toBe(true);
  });
  it.each([
    { name: '', reply: '', message: '' },
    { name: 'x'.repeat(101) },
    { reply: 'x'.repeat(255) },
    { reply: 'bad@example' },
    { reply: '1234567' },
    { reply: '+1234567890123456' },
    { message: 'short' },
    { message: 'x'.repeat(3001) },
    { name: 'Alex\r\nBcc: someone' },
    { name: '<img src=x>' },
    { message: '<script>alert(1)</script>' },
    { message: 'some text\u0000 hidden' },
    { reply: 42 },
  ])('rejects invalid fields: %j', (override) => {
    const result = validateEnquiry({ ...valid, ...override });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.fields).length).toBeGreaterThan(0);
  });
  it('rejects non-objects', () => {
    expect(validateEnquiry(null).ok).toBe(false);
  });

  it.each([
    {
      field: 'name',
      input: 'Alex <Admin>',
      corrected: 'Alex Admin',
      guidance:
        'Remove < and > from your name and keep it on one line. Retype any pasted text to remove hidden characters.',
    },
    {
      field: 'reply',
      input: 'alex>@example.test',
      corrected: 'alex@example.test',
      guidance:
        'Remove < and > from your email or phone and keep it on one line. Retype any pasted text to remove hidden characters.',
    },
    {
      field: 'message',
      input: 'Flag orders > 100 for review.',
      corrected: 'Flag orders over 100 for review.',
      guidance:
        'Replace < and > in your message with words such as “less than” or “over”. Retype any pasted text to remove hidden characters.',
    },
  ])(
    'explains how to correct prohibited characters in $field',
    ({ field, input, corrected, guidance }) => {
      expect(validateEnquiry({ ...valid, [field]: input })).toEqual({
        ok: false,
        fields: { [field]: guidance },
      });
      expect(validateEnquiry({ ...valid, [field]: corrected }).ok).toBe(true);
    },
  );
});
