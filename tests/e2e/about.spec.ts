import { expect, test } from '@playwright/test';
import { siteConfig, siteOrigin } from '../../site.config';
import { aboutCopy } from '../../src/content/about';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

test('About preserves approved facts and placeholders, metadata and sitemap entry', async ({
  page,
}) => {
  await page.goto('/');
  const homeTitle = await page.title();
  const homeDescription = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  await page.goto('/about/');
  await expect(page).toHaveTitle(aboutCopy.title);
  expect(await page.title()).not.toBe(homeTitle);
  expect(aboutCopy.description).not.toBe(homeDescription);
  const main = page.getByRole('main');
  await expect(main).toContainText(
    'three founders: Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali.',
  );
  for (const text of [
    aboutCopy.lede,
    aboutCopy.who.body,
    aboutCopy.expertise.caveat,
    aboutCopy.expertise.note,
    aboutCopy.proof.body,
    aboutCopy.name.body,
  ])
    await expect(main).toContainText(text);
  await expect(main.locator('h2')).toHaveText([
    aboutCopy.who.heading,
    aboutCopy.expertise.heading,
    aboutCopy.proof.heading,
    aboutCopy.name.heading,
    'Tell us about one slow process',
  ]);
  await expect(main.getByRole('listitem')).toHaveText(
    aboutCopy.expertise.items,
  );
  await expect(main.locator('img')).toHaveCount(0);
  await expect(main.locator('a')).toHaveCount(1);
  await expect(main.getByRole('link')).toHaveAttribute(
    'href',
    siteConfig.primaryCta.href,
  );
  await expect(main.getByRole('link')).toHaveText(siteConfig.primaryCta.label);
  const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain(`${siteOrigin}/about/</loc>`);
});

for (const width of [320, 1280]) {
  test(`About accessibility and visual evidence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about/');
    await page.evaluate(() => document.fonts.ready);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await page.screenshot({
      path: `.agentops-scratch/71-about-${width}.png`,
      fullPage: true,
    });
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
    const cta = page.getByRole('main').getByRole('link');
    await expect(cta).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact\/$/);
    await page.goto('/about/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoHorizontalScroll(page);
    await context.close();
  });
}
