import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Mobile navigation (below 64rem), where the Menu disclosure replaces the wide nav (#229, F-16).
test.use({
  viewport: { width: 375, height: 812 },
  reducedMotion: 'reduce',
});

const menu = (page: import('@playwright/test').Page) =>
  page.locator('details.menu');

test('closed mobile menu is not in the keyboard order', async ({ page }) => {
  await page.goto('/');
  const panelLinks = menu(page).locator('.menu-panel a');
  const count = await panelLinks.count();
  expect(count).toBeGreaterThan(0);

  const reached: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    reached.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('.menu-panel') ? 'menu-link' : (el?.tagName ?? '');
      }),
    );
  }
  expect(reached).not.toContain('menu-link');
});

test('open mobile menu links meet target sizes', async ({ page }) => {
  await page.goto('/');
  await menu(page).locator('summary').click();
  await expect(menu(page)).toHaveAttribute('open', '');

  const links = menu(page).locator('.menu-panel a');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const box = await link.boundingBox();
    const isPrimary = !(await link.getAttribute('class'))?.includes('sub');
    const label = await link.innerText();
    // Primary items 44 px tall (--layout-tap); every link at least 24 px (WCAG 2.5.8).
    expect(box?.height ?? 0, label).toBeGreaterThanOrEqual(isPrimary ? 44 : 24);
    expect(box?.width ?? 0, label).toBeGreaterThanOrEqual(24);
  }
});

test('Escape closes the open menu and returns focus to the Menu toggle', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = menu(page).locator('summary');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toHaveAttribute('open', '');

  await page.keyboard.press('Tab');
  await expect(menu(page).locator('.menu-panel a').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu(page)).not.toHaveAttribute('open', '');
  await expect(toggle).toBeFocused();
});

test('open mobile menu has no animation under reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await menu(page).locator('summary').click();
  const timing = await page.locator('.menu-panel').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { duration: cs.transitionDuration, animation: cs.animationName };
  });
  expect(timing.animation).toBe('none');
  expect(timing.duration.split(',').every((d) => parseFloat(d) === 0)).toBe(
    true,
  );
});

test('open mobile menu has no axe violations', async ({ page }) => {
  await page.goto('/');
  await menu(page).locator('summary').click();
  const results = await new AxeBuilder({ page })
    .include('.site-header')
    .analyze();
  expect(results.violations).toEqual([]);
});
