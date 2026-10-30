import { expect, test } from '@playwright/test';
import { siteConfig, siteOrigin } from '../../site.config';
import { dispatchCopy } from '../../src/content/dispatch';
import { homeCopy } from '../../src/content/home';
import { homeSeo } from '../../src/content/site';
import { services } from '../../src/content/services';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  expectPageMetadata,
} from './helpers/page-checks';

test('Home composes approved copy, six services and config-derived Organization', async ({
  page,
}) => {
  await page.goto('/');
  await expectPageMetadata(page, '/');
  await expect(page).toHaveTitle(homeSeo.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    homeSeo.description,
  );
  await expect(page.locator('h1')).toHaveText(dispatchCopy.title);
  await expect(page.locator('.hero-copy')).toContainText(dispatchCopy.lede);
  await expect(page.locator('main h2')).toHaveText([
    homeCopy.services.heading,
    'Tell us about one slow process',
  ]);
  await expect(page.locator('main')).toContainText(homeCopy.services.intro);
  await expect(page.locator('.service-row h3')).toHaveText(
    services.map(({ label }) => label),
  );
  for (const service of services) {
    const row = page.locator('.service-row').filter({
      has: page.getByRole('heading', { name: service.label, exact: true }),
    });
    await expect(row).toContainText(service.summary);
    await expect(row.getByRole('link')).toHaveAttribute('href', service.href);
  }
  expect(
    JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    ),
  ).toEqual({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.brand,
    url: siteOrigin,
  });
  expect(await (await page.request.get('/sitemap-0.xml')).text()).toContain(
    `${siteOrigin}/</loc>`,
  );
});

for (const width of [320, 480, 768, 1024, 1440]) {
  test(`Home reflows and passes axe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    const cta = page.locator('.hero-copy .button');
    const field = page.locator('.dispatch-field');
    expect(
      (await cta.boundingBox())!.y + (await cta.boundingBox())!.height,
    ).toBeLessThan((await field.boundingBox())!.y);
    if (width === 320 || width === 1440)
      await page.screenshot({
        path: `docs/engineering/evidence/58-home-${width}.png`,
        fullPage: true,
      });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoHorizontalScroll(page);
  });
}

test('Home scene lifecycle: play, pause offscreen/hidden, done, replay and Escape', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.locator('.dispatch-field');
  const heroReplay = hero.getByRole('button');
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-state', 'done');
  await heroReplay.press('Enter');
  await expect(hero).toHaveAttribute('data-state', 'playing');
  await expect(hero).toHaveAttribute('data-state', 'done');
  await heroReplay.press('Enter');
  await expect(hero).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('Escape');
  await expect(hero).toHaveAttribute('data-state', 'done');
  await expect(heroReplay).toBeFocused();

  const scene = page.locator('.service-row').first();
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(scene).toHaveAttribute('data-state', 'paused');
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-state', 'paused');
  expect(
    await scene.evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState === 'paused'),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-state', 'done');
  await scene.getByRole('button').press('Enter');
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await page.keyboard.press('Escape');
  await expect(scene).toHaveAttribute('data-state', 'done');
  await expect(scene.getByRole('button')).toBeFocused();
});

for (const mode of ['no-js', 'save-data', 'reduced-motion'] as const) {
  test(`Home static fallback and keyboard CTAs: ${mode}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: mode !== 'no-js',
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
      viewport: { width: 320, height: 900 },
    });
    if (mode === 'save-data')
      await context.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', {
          value: Object.assign(new EventTarget(), { saveData: true }),
        }),
      );
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-replay]:visible')).toHaveCount(0);
    await expect(page.locator('figcaption')).toHaveCount(7);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    for (const link of await page.locator('main a').all()) {
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      expect(
        await link.evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe('solid');
    }
    await expectNoHorizontalScroll(page);
    await context.close();
  });
}
