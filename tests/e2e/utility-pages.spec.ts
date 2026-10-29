import { expect, test } from '@playwright/test';
import { privacyCopy } from '../../src/content/privacy';
import { notFoundCopy } from '../../src/content/not-found';
import { siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  expectPageMetadata,
} from './helpers/page-checks';

test('privacy renders the approved draft and unresolved facts', async ({
  page,
}) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle(privacyCopy.title);
  const main = page.getByRole('main');
  await expect(main).toContainText(privacyCopy.updated);
  await expect(main).toContainText(privacyCopy.status);
  for (const section of privacyCopy.sections) {
    await expect(
      main.getByRole('heading', { name: section.heading, exact: true }),
    ).toBeVisible();
    await expect(main).toContainText(section.body);
  }
  await expect(main).toContainText('[[PLACEHOLDER: Q10 analytics provider]]');
  await expect(main).toContainText(
    '[[PLACEHOLDER: Q9 registered name and address',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(
    main.getByRole('heading', { name: 'Tell us about one slow process' }),
  ).toHaveCount(0);
});

test('sitemap includes privacy and excludes the 404 page', async ({
  request,
}) => {
  const index = await request.get('/sitemap-index.xml');
  const locations = [...(await index.text()).matchAll(/<loc>(.*?)<\/loc>/g)];
  expect(locations.length).toBeGreaterThan(0);
  let sitemap = '';
  for (const location of locations) {
    const response = await request.get(new URL(location[1]!).pathname);
    sitemap += await response.text();
  }
  expect(sitemap).toContain(`<loc>${siteOrigin}/privacy/</loc>`);
  expect(sitemap).not.toMatch(/<loc>[^<]*\/404(?:\/|\.html)/);
});

test('built pages have unique titles and descriptions', async ({ request }) => {
  const titles: string[] = [];
  const descriptions: string[] = [];
  for (const path of [
    '/',
    '/privacy/',
    '/contact/',
    '/contact/thanks/',
    '/contact/error/',
    '/404.html',
  ]) {
    const html = await (await request.get(path)).text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(
      /<meta name="description" content="([^"]+)"/,
    )?.[1];
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
    titles.push(title!);
    descriptions.push(description!);
  }
  expect(new Set(titles).size).toBe(titles.length);
  expect(new Set(descriptions).size).toBe(descriptions.length);
});

for (const width of [320, 1280]) {
  test(`utility pages work without JavaScript at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    try {
      const response = await page.goto('/unknown/nested/path/');
      expect(response?.status()).toBe(404);
      // Astro serves the static 404 document for unknown paths.
      await expectPageMetadata(page, '/404/');
      await expect(page).toHaveTitle(notFoundCopy.title);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      );
      await expect(page.getByRole('main')).toContainText(notFoundCopy.body);
      for (const action of notFoundCopy.actions) {
        await expect(
          page
            .getByRole('main')
            .getByRole('link', { name: action.label, exact: true }),
        ).toHaveAttribute('href', action.href);
      }
      await expectNoHorizontalScroll(page);
      await page.screenshot({
        path: `.agentops-scratch/62-404-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole('main')
        .getByRole('link', { name: 'Home', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/');
      await page.goto('/unknown/nested/path/');
      await page
        .getByRole('main')
        .getByRole('link', { name: 'Contact', exact: true })
        .focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/contact/');
      await page.goto('/privacy/');
      await expectNoHorizontalScroll(page);
      await page.screenshot({
        path: `.agentops-scratch/62-privacy-${width}.png`,
        fullPage: true,
      });
    } finally {
      await context.close();
    }
  });

  test(`utility pages have no axe violations at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/unknown/nested/path/', '/privacy/']) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
  });
}
