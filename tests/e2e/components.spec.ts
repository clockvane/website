import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { primaryCta } from '../../src/content/navigation';

for (const width of [320, 768, 1024, 1440]) {
  test(`page components reflow, expose links and pass axe at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/__components/');
    await page.evaluate(() => document.fonts.ready);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await expect(
      page.locator('script:not([src]), [style], svg style'),
    ).toHaveCount(0);
    await expect(
      page.locator('main [tabindex="0"], main button:visible'),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .locator('[aria-current="page"]'),
    ).toHaveText('Services');
    await expect(page.locator('main ol.process-home > li')).toHaveCount(4);
    await page.locator('main').focus();
    for (const link of await page.locator('main a').all()) {
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      const box = (await link.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(
        await link.evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe('solid');
      await expect(link).toBeInViewport();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `.agentops-scratch/65-components-${width}.png`,
      fullPage: true,
    });
    for (const enlarged of [false, true]) {
      if (enlarged)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.locator('.band a').focus();
    expect(
      await page
        .locator('.band a')
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
  });
}

test('fixture remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/__components/');
  await expect(page.locator('main h1')).toHaveText('Services');
  await expect(page.locator('.service-row')).toHaveCount(8);
  await expect(page.locator('.band a')).toHaveAttribute(
    'href',
    primaryCta.href,
  );
  await context.close();
});
