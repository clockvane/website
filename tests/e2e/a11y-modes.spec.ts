import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const paths = ['/', '/about/', '/how-we-work/', '/contact/', '/privacy/'];

for (const path of paths) {
  test(`${path} passes axe with forced colors and reduced motion`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(path);
    await expect(page.locator('html')).not.toHaveClass(/js-motion/);
    // axe does not model forced-colors overrides (the browser replaces author
    // colors with system colors), so color-contrast is meaningless here.
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    const outline = await skip.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).toBe('solid');
    expect(outline.width).toBeGreaterThan(0);
    await context.close();
  });
}
