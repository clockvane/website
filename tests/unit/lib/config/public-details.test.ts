import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../../../site.config';
import { publicDetails } from '../../../../src/lib/config/public-details';

describe('public footer details', () => {
  it('omits placeholders and empty contact/social values', () => {
    expect(publicDetails(siteConfig)).toEqual({
      email: undefined,
      phone: undefined,
      socials: [],
    });
    expect(
      publicDetails({
        ...siteConfig,
        email: '',
        phone: ' ',
        socials: { linkedin: '', github: 'javascript:alert(1)' },
      }),
    ).toEqual({ email: undefined, phone: undefined, socials: [] });
  });
  it('exposes supplied config values and only web social links', () => {
    expect(
      publicDetails({
        ...siteConfig,
        email: 'hello@example.test',
        phone: '+123456789',
        socials: {
          linkedin: 'https://example.test/profile',
          github: 'http://example.test/code',
        },
      }),
    ).toEqual({
      email: 'hello@example.test',
      phone: '+123456789',
      socials: [
        { label: 'linkedin', href: 'https://example.test/profile' },
        { label: 'github', href: 'http://example.test/code' },
      ],
    });
  });
});
