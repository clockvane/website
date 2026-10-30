import { expect, test } from '@playwright/test';
import { services } from '../../src/content/services';
import { servicePages } from '../../src/content/service-pages';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  expectPageMetadata,
} from './helpers/page-checks';

for (const route of [
  '/services/',
  ...services.map((service) => service.href),
]) {
  test(`${route} metadata, accessibility, reflow and screenshots`, async ({
    page,
  }) => {
    await page.goto(route);
    await expectPageMetadata(page, route);
    for (const width of [320, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalScroll(page);
      if (width === 320 || width === 1440) {
        await expectNoAxeViolations(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.screenshot({
          path: `.agentops-scratch/59-${route.split('/').filter(Boolean).join('-')}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.setViewportSize({ width: 320, height: 900 });
    await expectNoHorizontalScroll(page);
  });

  for (const mode of ['no-js', 'reduce', 'save-data'] as const) {
    test(`${route} ${mode} keeps finished scenes and keyboard navigation`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        javaScriptEnabled: mode !== 'no-js',
        reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference',
        viewport: { width: 320, height: 900 },
      });
      if (mode === 'save-data')
        await context.addInitScript(() => {
          Object.defineProperty(navigator, 'connection', {
            value: { saveData: true },
          });
        });
      const page = await context.newPage();
      await page.goto(route);
      await expectNoHorizontalScroll(page);
      await expect(page.locator('[data-scene]')).toHaveCount(
        route === '/services/' ? 6 : 1,
      );
      await expect(
        page.getByRole('button', { name: /Replay example/ }),
      ).toHaveCount(0);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('main').getByRole('link', { name: 'Home', exact: true }),
      ).toBeFocused();
      await context.close();
    });
  }
}

test('overview anchors, detail sections and related links match the copy deck', async ({
  page,
}) => {
  await page.goto('/services/');
  for (const service of services) {
    await page
      .getByRole('main')
      .getByRole('navigation', { name: 'Services', exact: true })
      .getByRole('link', { name: service.label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${service.slug}$`));
    await expect(page.locator(`#${service.slug}`)).toContainText(
      servicePages[service.slug].summary,
    );
    await page
      .locator(`#${service.slug}`)
      .getByRole('link', { name: service.linkLabel })
      .click();
    await expect(page).toHaveURL(service.href);
    const main = page.getByRole('main');
    await expect(main.locator('h2')).toHaveText([
      'What we do',
      'Who it is for',
      'Typical deliverables',
      'How an engagement runs',
      'What we need from you',
      'Related services',
      'Tell us about one slow process',
    ]);
    for (const text of [
      servicePages[service.slug].intro,
      servicePages[service.slug].what,
      servicePages[service.slug].audience,
      ...servicePages[service.slug].deliverables,
      ...servicePages[service.slug].needs,
    ])
      await expect(main).toContainText(text);
    await expect(
      page.locator('[aria-labelledby="service-related"] a'),
    ).toHaveCount(2);
    await page.goto('/services/');
  }
});
