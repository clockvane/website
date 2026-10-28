import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 768, 1024, 1440]) {
  test(`page components reflow, expose links and pass axe at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/__components/');
    await page.evaluate(() => document.fonts.ready);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await expect(page.locator('script, [style], svg style')).toHaveCount(0);
    await expect(page.locator('main [tabindex="0"], main button')).toHaveCount(
      0,
    );
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .locator('[aria-current="page"]'),
    ).toHaveText('Services');
    const diagrams = page.locator('.workflow');
    await expect(diagrams.first().locator('.workflow-horizontal')).toBeVisible({
      visible: width >= 1024,
    });
    await expect(diagrams.last().locator('.workflow-vertical')).toBeVisible();
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
      for (const svg of await page
        .locator('.workflow-canvas > svg:visible')
        .all()) {
        const labelsFit = await svg.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          return [...el.querySelectorAll('text')].every((text) => {
            const box = text.getBoundingClientRect();
            return (
              box.left >= bounds.left &&
              box.right <= bounds.right &&
              Number.parseFloat(getComputedStyle(text).fontSize) >=
                Number.parseFloat(
                  getComputedStyle(document.documentElement).fontSize,
                )
            );
          });
        });
        expect(labelsFit).toBe(true);
      }
    }
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.locator('.closing-grid a').focus();
    expect(
      await page
        .locator('.closing-grid a')
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
  await expect(page.locator('figcaption')).toHaveCount(2);
  await expect(page.locator('.closing-grid a')).toHaveAttribute(
    'href',
    '/contact/',
  );
  await context.close();
});
