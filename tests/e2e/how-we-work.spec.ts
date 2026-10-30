import { expect, test } from '@playwright/test';
import { howWeWork as copy } from '../../src/content/how-we-work';
import { siteConfig, siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

test('process, engagement models and unresolved facts follow the copy deck', async ({
  page,
}) => {
  await page.goto('/how-we-work/');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading')).toHaveText([
    copy.heading,
    copy.processHeading,
    ...copy.steps.map((step) => step.title),
    copy.modelsHeading,
    ...copy.models.map((model) => model.title),
    copy.pricingHeading,
    copy.handoverHeading,
    'Tell us about one slow process',
  ]);
  const steps = main.getByRole('list').getByRole('listitem');
  await expect(steps).toHaveCount(4);
  for (const [index, step] of copy.steps.entries()) {
    await expect(steps.nth(index)).toContainText(step.body);
    await expect(steps.nth(index)).toContainText(step.output);
  }
  for (const model of copy.models) await expect(main).toContainText(model.body);
  await expect(main).toContainText(copy.pricing);
  await expect(main).toContainText(copy.handover);
  await expect(main.locator('.cta-band')).toHaveCount(1);
  await main.getByRole('link', { name: siteConfig.primaryCta.label }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test('has distinct SEO metadata and a sitemap entry', async ({ page }) => {
  await page.goto('/');
  const homeTitle = await page.title();
  const homeDescription = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  await page.goto('/how-we-work/');
  await expect(page).toHaveTitle(`${copy.title} | ${siteConfig.brand}`);
  expect(await page.title()).not.toBe(homeTitle);
  expect(copy.description).not.toBe(homeDescription);
  const sitemap = await page.request.get('/sitemap-0.xml');
  expect(await sitemap.text()).toContain(
    `<loc>${siteOrigin}/how-we-work/</loc>`,
  );
});

for (const width of [320, 1280]) {
  test(`accessible at ${width}px and readable without JavaScript`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/how-we-work/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('script')).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const cta = page.locator('main .cta-band a');
    await expect(cta).toHaveText(siteConfig.primaryCta.label);
    await expect(cta).toHaveAttribute('href', siteConfig.primaryCta.href);
    await cta.focus();
    await expect(cta).toBeFocused();
    expect(
      await cta.evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe('solid');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoHorizontalScroll(page);
    await context.close();
    const noJs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto('/how-we-work/');
    await expect(noJsPage.getByRole('main')).toContainText(copy.pricing);
    await noJsPage.locator('main .cta-band a').click();
    await expect(noJsPage).toHaveURL(/\/contact\/$/);
    await noJs.close();
  });
}
