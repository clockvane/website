import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../../../site.config';
import { publicDetails } from '../../../../src/lib/config/public-details';

describe('public footer details', () => {
  it('shows the configured email and phone numbers and omits placeholder socials', () => {
    expect(publicDetails(siteConfig)).toEqual({
      email: 'clockvane.support@gmail.com',
      phones: [
        { label: '+91 90633 99157', href: 'tel:+919063399157' },
        { label: '+91 94911 25109', href: 'tel:+919491125109' },
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
      phones: [{ label: '+1 555 0100', href: 'tel:+15550100' }],
      socials: [
        { label: 'linkedin', href: 'https://example.test/profile' },
        { label: 'github', href: 'http://example.test/code' },
      ],
    });
  });
});
