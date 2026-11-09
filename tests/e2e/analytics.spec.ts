import { expect, test, type Page } from '@playwright/test';
import { analyticsToken, siteOrigin } from '../../site.config';
import { BEACON_SRC } from '../../src/lib/analytics/beacon';

// Cloudflare Web Analytics (PRD Q10). Every third-party request is intercepted: nothing reaches
// Cloudflare and no dashboard access is needed. The production origin is served from the local
// preview so the origin check in src/lib/analytics/beacon.ts sees the live site.
const CLOUDFLARE = /^https:\/\/(static\.)?cloudflareinsights\.com\//;
const RUM = 'https://cloudflareinsights.com/cdn-cgi/rum';
// Stands in for beacon.min.js: reports one page view the way the real script does.
const STUB = `fetch(${JSON.stringify(RUM)}, { method: 'POST', body: '{}', mode: 'no-cors' });`;

test.skip(!analyticsToken, 'analytics is not configured in site.config.ts');

async function serveProductionLocally(page: Page, baseURL: string) {
  await page.route(`${siteOrigin}/**`, async (route) => {
    const { pathname, search } = new URL(route.request().url());
    const response = await route.fetch({
      url: new URL(pathname + search, baseURL).href,
    });
    await route.fulfill({ response });
  });
}

async function recordCloudflare(page: Page): Promise<string[]> {
  const requests: string[] = [];
  await page.route(CLOUDFLARE, async (route) => {
    const url = route.request().url();
    requests.push(url);
    await route.fulfill(
      url === BEACON_SRC
        ? { contentType: 'text/javascript', body: STUB }
        : { status: 204 },
    );
  });
  return requests;
}

test('loads one deferred beacon with the configured token on the live origin', async ({
  page,
  baseURL,
}) => {
  await serveProductionLocally(page, baseURL!);
  const requests = await recordCloudflare(page);
  await page.goto(`${siteOrigin}/`);
  const beacon = page.locator('script[data-cf-beacon]');
  await expect(beacon).toHaveCount(1);
  await expect(beacon).toHaveAttribute('src', BEACON_SRC);
  expect(
    JSON.parse((await beacon.getAttribute('data-cf-beacon')) ?? ''),
  ).toEqual({ token: analyticsToken });
  await expect.poll(() => requests).toEqual([BEACON_SRC, RUM]);
});

test('Global Privacy Control stops the script and every beacon', async ({
  page,
  baseURL,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', {
      get: () => true,
    }),
  );
  await serveProductionLocally(page, baseURL!);
  const requests = await recordCloudflare(page);
  await page.goto(`${siteOrigin}/`, { waitUntil: 'networkidle' });
  await expect(page.locator('script[data-cf-beacon]')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('previews and local runs are never counted', async ({ page }) => {
  const requests = await recordCloudflare(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toHaveAttribute(
    'data-analytics-token',
    analyticsToken!,
  );
  await expect(page.locator('script[data-cf-beacon]')).toHaveCount(0);
  expect(requests).toEqual([]);
});
