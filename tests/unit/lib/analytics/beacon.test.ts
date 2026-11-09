import { describe, expect, it } from 'vitest';
import {
  BEACON_SRC,
  analyticsAllowed,
  beaconConfig,
} from '../../../../src/lib/analytics/beacon';
import { ANALYTICS_SCRIPT } from '../../../../infra/headers/render';

describe('analyticsAllowed', () => {
  const live = {
    pageOrigin: 'https://site.example',
    siteOrigin: 'https://site.example',
  };

  it('loads analytics on the site origin unless Global Privacy Control is on', () => {
    expect(analyticsAllowed(live)).toBe(true);
    expect(analyticsAllowed({ ...live, globalPrivacyControl: false })).toBe(
      true,
    );
    expect(analyticsAllowed({ ...live, globalPrivacyControl: true })).toBe(
      false,
    );
  });

  it.each([
    'http://127.0.0.1:4401',
    'https://abc123.site.example',
    'http://site.example',
  ])('never loads analytics on another origin: %s', (pageOrigin) => {
    expect(analyticsAllowed({ ...live, pageOrigin })).toBe(false);
  });
});

describe('beacon', () => {
  it('builds the data-cf-beacon value from the token only', () => {
    expect(JSON.parse(beaconConfig('0'.repeat(32)))).toEqual({
      token: '0'.repeat(32),
    });
  });

  it('loads exactly the script URL the CSP allows', () => {
    expect(BEACON_SRC).toBe(ANALYTICS_SCRIPT);
  });
});
