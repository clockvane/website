import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../../../site.config';
import { publicDetails } from '../../../../src/lib/config/public-details';

describe('public footer details', () => {
  it('shows the configured email and phone numbers and omits placeholder socials', () => {
    expect(publicDetails(siteConfig)).toEqual({
      email: 'clockvane.support@gmail.com',
      phones: [
        {
          number: '+91 90633 99157',
          label: '+91\u00a090633\u00a099157',
          href: 'tel:+919063399157',
        },
        {
          number: '+91 94911 25109',
          label: '+91\u00a094911\u00a025109',
          href: 'tel:+919491125109',
        },
      ],
      socials: [],
    });
    expect(
      publicDetails({
        ...siteConfig,
        email: '',
        phones: [' ', '[[PLACEHOLDER: phone]]'],
        socials: { linkedin: '', github: 'javascript:alert(1)' },
      }),
    ).toEqual({ email: undefined, phones: [], socials: [] });
  });
  it('exposes supplied config values and only web social links', () => {
    expect(
      publicDetails({
        ...siteConfig,
        email: 'hello@example.test',
        phones: ['+1 555 0100'],
        socials: {
          linkedin: 'https://example.test/profile',
          github: 'http://example.test/code',
        },
      }),
    ).toEqual({
      email: 'hello@example.test',
      phones: [
        {
          number: '+1 555 0100',
          label: '+1\u00a0555\u00a00100',
          href: 'tel:+15550100',
        },
      ],
      socials: [
        { label: 'linkedin', href: 'https://example.test/profile' },
        { label: 'github', href: 'http://example.test/code' },
      ],
    });
  });
});
