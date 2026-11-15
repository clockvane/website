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

  test('a focused link at the end of the page is not hidden under the bar (WCAG 2.4.11)', async ({
    page,
  }) => {
    await page.goto('/services/ai-automation/');
    const link = page.locator('main a:visible').last();
    // Put the link's top just inside the bar's area, so it is in the viewport but covered.
    await link.evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - (window.innerHeight - 40));
    });
    await link.focus();
    const barBox = await bar(page).boundingBox();
    const linkBox = await link.boundingBox();
    expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(barBox!.y);
  });

  test('the focus ring on the bar link is visible (2 px, light.focus)', async ({
    page,
  }) => {
    await page.goto('/');
    const link = bar(page).getByRole('link', { name: 'Book a call' });
    await link.focus();
    const outline = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        style: cs.outlineStyle,
        width: cs.outlineWidth,
        color: cs.outlineColor,
      };
    });
    // #2447E8, measured at 5.9:1 on light.surface (design-system.md).
    expect(outline).toEqual({
      style: 'solid',
      width: '2px',
      color: 'rgb(36, 71, 232)',
    });
  });

  test('the bar passes axe', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .include('aside.action-bar')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('short phone viewports (landscape)', () => {
  test.use({ viewport: { width: 667, height: 375 }, reducedMotion: 'reduce' });

  test('the bar steps aside while the open menu runs to the bottom, and the last menu link is reachable', async ({
    page,
  }) => {
    await page.goto('/services/ai-automation/');
    await page.locator('details.menu summary').click();
    await expect(page.locator('details.menu')).toHaveAttribute('open', '');
    await expect(bar(page)).toBeHidden();

    const last = page.locator('details.menu .menu-panel a').last();
    await last.scrollIntoViewIfNeeded();
    await last.focus();
    const linkBox = await last.boundingBox();
    expect(linkBox, 'last menu link is rendered').not.toBeNull();
    // The topmost element at the link's centre must be the link itself (not covered).
    const topmost = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el?.closest('a')?.getAttribute('href') ?? null;
      },
      {
        x: linkBox!.x + linkBox!.width / 2,
        y: linkBox!.y + linkBox!.height / 2,
      },
    );
    expect(topmost).toBe(await last.getAttribute('href'));
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
