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
});
