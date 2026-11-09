/**
 * Loads Cloudflare Web Analytics once, after parsing, on the production origin only and never when the
 * visitor sends Global Privacy Control. Rendered only when `site.config.ts` holds a token (BaseLayout).
 */
import {
  BEACON_SRC,
  TOKEN_ATTRIBUTE,
  analyticsAllowed,
  beaconConfig,
} from '../lib/analytics/beacon';

const token = document.body.getAttribute(TOKEN_ATTRIBUTE);
const canonical = document.querySelector<HTMLLinkElement>(
  'link[rel="canonical"]',
);
if (
  token &&
  canonical &&
  !document.querySelector('script[data-cf-beacon]') &&
  analyticsAllowed({
    globalPrivacyControl: (
      navigator as Navigator & { globalPrivacyControl?: unknown }
    ).globalPrivacyControl,
    pageOrigin: location.origin,
    siteOrigin: new URL(canonical.href).origin,
  })
) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = BEACON_SRC;
  beacon.dataset['cfBeacon'] = beaconConfig(token);
  document.body.append(beacon);
}
