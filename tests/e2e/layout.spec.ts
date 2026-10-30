import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { siteConfig, siteOrigin } from '../../site.config';

for (const width of [320, 480, 768, 1024, 1280]) {
  test(`shared shell at ${width}px works without JavaScript`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.locator('.compact-cta')).toBeVisible({
      visible: width >= 480 && width < 1024,
    });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
      'solid',
    );
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const summary = page.locator(
      width < 1024 ? '.mobile-nav summary' : '.desktop-nav summary',
    );
    await summary.focus();
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await expect(
      page.getByRole('banner').getByRole('link', {
        name: 'Business process automation',
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).not.toHaveAttribute('open');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await context.close();
  });
}

test('metadata and empty-safe footer use site config', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(
    `Automate repetitive business work | ${siteConfig.brand}`,
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteOrigin}/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${siteOrigin}/`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${siteOrigin}/og.png`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('footer')).not.toContainText('PLACEHOLDER');
  await expect(
    page.locator('footer a[href^="mailto:"], footer a[href^="tel:"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Social links' }),
  ).toHaveCount(0);
  expect((await page.request.get('/og.png')).headers()['content-type']).toBe(
    'image/png',
  );
});

for (const width of [320, 1280]) {
  test(`axe, targets and enlarged text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    // V2 uses one font; an unused legacy @font-face need not be downloaded.
    expect(
      await page.evaluate(() =>
        [...document.fonts]
          .filter((face) => face.status === 'loaded')
          .map((face) => face.family),
      ),
    ).toEqual([expect.stringContaining('Public Sans')]);
    expect(
      await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.endsWith('.woff2'))
          .map((entry) => new URL(entry.name).pathname),
      ),
    ).toEqual(['/fonts/public-sans-latin-wght-normal.woff2']);
    await expect(
      page.locator('script:not([type="application/ld+json"]):not([src])'),
    ).toHaveCount(0);
    await page.screenshot({
      path: `.agentops-scratch/layout-${width}.png`,
      fullPage: true,
    });
    for (const open of [false, true]) {
      if (open)
        await page
          .locator(
            width < 1024 ? '.mobile-nav summary' : '.desktop-nav summary',
          )
          .click();
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      for (const control of await page
        .locator('a:visible, summary:visible')
        .all()) {
        const box = await control.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(
          box!.width,
          await control.evaluate((el) => el.outerHTML),
        ).toBeGreaterThanOrEqual(44);
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.keyboard.press('Tab');
    await page.locator('footer a').first().focus();
    expect(
      await page
        .locator('footer a')
        .first()
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
  });
}
