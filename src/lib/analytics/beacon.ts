/**
 * Cloudflare Web Analytics loading policy (PRD Q10, docs/security/privacy.md). Pure, so it is unit tested;
 * `src/scripts/analytics.ts` applies it in the browser. The beacon origins are mirrored in `infra/headers`.
 */

/** The only analytics script; its exact URL is the CSP `script-src` entry. */
export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Body attribute that carries the public token from `site.config.ts` to the loader. */
export const TOKEN_ATTRIBUTE = 'data-analytics-token';

export interface AnalyticsContext {
  /** `navigator.globalPrivacyControl`: `true` opts the visitor out. */
  globalPrivacyControl?: unknown;
  /** Origin the page is served from (`location.origin`). */
  pageOrigin: string;
  /** Production origin from `site.config.ts` (the page's canonical URL). */
  siteOrigin: string;
}

/**
 * Analytics loads only on the production origin, so previews, staging, CI and local runs are never
 * counted, and never when the visitor sends Global Privacy Control.
 */
export function analyticsAllowed(context: AnalyticsContext): boolean {
  return (
    context.globalPrivacyControl !== true &&
    context.pageOrigin === context.siteOrigin
  );
}

/** The `data-cf-beacon` value from Cloudflare's manual snippet. */
export function beaconConfig(token: string): string {
  return JSON.stringify({ token });
}
