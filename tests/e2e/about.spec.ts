import { expect, test } from '@playwright/test';
import { primaryCta } from '../../src/content/navigation';
import { siteConfig, siteOrigin } from '../../site.config';
import { aboutCopy } from '../../src/content/about';
import { servicesOverview } from '../../src/content/services';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

test('About follows the copy deck, metadata and sitemap entry', async ({
  page,
}) => {
  await page.goto('/');
  const homeTitle = await page.title();
  const homeDescription = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  await page.goto('/about/');
  await expect(page).toHaveTitle(aboutCopy.title);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    aboutCopy.title,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    aboutCopy.description,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    aboutCopy.description,
  );
  expect(await page.title()).not.toBe(homeTitle);
  expect(aboutCopy.description).not.toBe(homeDescription);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    aboutCopy.heading,
  );
  await expect(main.locator('h2')).toHaveText([
    aboutCopy.who.heading,
    aboutCopy.expertise.heading,
    aboutCopy.proof.heading,
    'What would you like to get done?',
  ]);
  for (const text of [
    aboutCopy.lede,
    aboutCopy.who.body,
    aboutCopy.expertise.body,
    aboutCopy.proof.body,
  ])
    await expect(main).toContainText(text);
  await expect(main).not.toContainText('PLACEHOLDER');
  await expect(
    page.locator('a[href*="github.com"], a[href*="medium.com"]'),
  ).toHaveCount(0);
  await expect(main.locator('img')).toHaveCount(0);
  await expect(
    main.getByRole('link', { name: aboutCopy.expertise.link.label }),
  ).toHaveAttribute('href', aboutCopy.expertise.link.href);
  await expect(main.locator('.band-wrap')).toHaveCount(1);
  await expect(main.locator('.band-wrap a')).toContainText(
    siteConfig.primaryCta.label,
  );
  await expect(main.locator('.band-wrap a')).toHaveAttribute(
    'href',
    primaryCta.href,
  );
  const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain(`${siteOrigin}/about/</loc>`);
});

for (const width of [320, 768, 1280]) {
  test(`Explore our services reaches the overview with HTTP 200 at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about/');
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().isNavigationRequest() &&
        new URL(response.url()).pathname === '/services/',
    );
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Explore our services', exact: true })
      .click();
    expect((await responsePromise).status()).toBe(200);
    await expect(page).toHaveURL(/\/services\/$/);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toHaveText(servicesOverview.heading);
  });

  test(`About accessibility and reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about/');
    await page.evaluate(() => document.fonts.ready);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
  });

  test(`About works without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/about/');
    await expectNoHorizontalScroll(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: aboutCopy.expertise.link.label }),
    ).toBeFocused();
    await expect(page.locator('main .band-wrap a')).toHaveAttribute(
      'href',
      primaryCta.href,
    );
    await page.goto('/about/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoHorizontalScroll(page);
    await context.close();
  });
}
