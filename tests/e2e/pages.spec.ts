import { expect, test } from '@playwright/test';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  expectPageMetadata,
  routes,
  viewports,
} from './helpers/page-checks';

for (const route of routes) {
  test.describe(`page ${route}`, () => {
    test(`metadata and single h1 @smoke`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expectPageMetadata(page, route);
    });

    for (const viewport of viewports) {
      test(`axe and reflow at ${viewport.width}px @smoke`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route);
        await expectNoAxeViolations(page);
        await expectNoHorizontalScroll(page);
      });
    }
  });
}
