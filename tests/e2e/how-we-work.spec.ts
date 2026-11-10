import { expect, test } from '@playwright/test';
import { primaryCta } from '../../src/content/navigation';
import { howWeWork as copy } from '../../src/content/how-we-work';
import { siteConfig, siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

test('process, working models, FAQ and unresolved facts follow the copy deck', async ({
  page,
}) => {
  await page.goto('/how-we-work/');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading')).toHaveText([
    copy.heading,
    copy.steps.heading,
    ...copy.steps.items.map((step) => step.title),
    copy.support.heading,
    copy.models.heading,
    copy.pricing.heading,
    copy.handover.heading,
    copy.faq.heading,
    ...copy.faq.items.map((item) => item.title),
    'What would you like to get done?',
  ]);
  const steps = main.locator('ol > li');
  await expect(steps).toHaveCount(4);
  for (const [index, step] of copy.steps.items.entries())
    await expect(steps.nth(index)).toContainText(step.body);
  await expect(main.locator('ul > li')).toHaveText(copy.models.items);
  for (const text of [
    copy.lede,
    copy.support.body,
    copy.models.placeholder,
    copy.pricing.body,
    copy.handover.body,
    ...copy.faq.items.map((item) => item.body),
  ])
    await expect(main).toContainText(text);
  await expect(main.locator('.band-wrap')).toHaveCount(1);
  await expect(
    main.getByRole('link', { name: siteConfig.primaryCta.label }),
  ).toHaveAttribute('href', primaryCta.href);
});

test('has distinct SEO metadata and a sitemap entry', async ({ page }) => {
  await page.goto('/');
  const homeTitle = await page.title();
  const homeDescription = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  await page.goto('/how-we-work/');
  await expect(page).toHaveTitle(copy.title);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    copy.title,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    copy.description,
  );
  expect(await page.title()).not.toBe(homeTitle);
  expect(copy.description).not.toBe(homeDescription);
  const sitemap = await page.request.get('/sitemap-0.xml');
  expect(await sitemap.text()).toContain(
    `<loc>${siteOrigin}/how-we-work/</loc>`,
  );
});

for (const width of [320, 768, 1280]) {
  test(`accessible at ${width}px and readable without JavaScript`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/how-we-work/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('script:not([src])')).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const cta = page.locator('main .band-wrap a');
    await expect(cta).toContainText(siteConfig.primaryCta.label);
    await expect(cta).toHaveAttribute('href', primaryCta.href);
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
    await expect(noJsPage.getByRole('main')).toContainText(copy.pricing.body);
    await expect(noJsPage.locator('main .band-wrap a')).toHaveAttribute(
      'href',
      primaryCta.href,
    );
    await noJs.close();
  });
}
