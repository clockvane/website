import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fixed bottom action bar on phone widths, home and service pages (#228, F-13).
const bar = (page: import('@playwright/test').Page) =>
  page.locator('aside.action-bar');

test.describe('phone widths', () => {
  test.use({ viewport: { width: 375, height: 740 }, reducedMotion: 'reduce' });

  for (const path of ['/', '/services/', '/services/ai-automation/']) {
    test(`${path} shows the primary action pinned to the bottom`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, 1100));
      const box = await bar(page).boundingBox();
      expect(box, 'action bar is rendered').not.toBeNull();
      const viewport = page.viewportSize();
      expect(box!.y + box!.height).toBeCloseTo(viewport!.height, 0);

      const link = bar(page).getByRole('link', { name: 'Book a call' });
      await expect(link).toBeVisible();
      const target = await link.boundingBox();
      expect(target!.height).toBeGreaterThanOrEqual(44);
    });
  }

  test('header CTA is removed while the bar is shown, so one primary action is announced', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('.site-header a.cta')).toBeHidden();
    await expect(
      bar(page).getByRole('link', { name: 'Book a call' }),
    ).toHaveCount(1);
  });

  test('footer is not covered at the end of the page', async ({ page }) => {
    await page.goto('/services/ai-automation/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = await page.locator('footer').boundingBox();
    const barBox = await bar(page).boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(barBox!.y);
  });

  test('the bar passes axe', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .include('aside.action-bar')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('wide widths', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the bar is hidden and the header CTA is shown', async ({ page }) => {
    await page.goto('/');
    await expect(bar(page)).toBeHidden();
    await expect(page.locator('.site-header a.cta')).toBeVisible();
  });
});
