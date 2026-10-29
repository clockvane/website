import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { siteOrigin } from '../../../site.config';

/** Routes to cover. Page PRs add their path here. */
export const routes = ['/', '/privacy/', '/how-we-work/'];

export const viewports = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

/** Title, description, canonical, OG and Twitter tags, and a single h1. */
export async function expectPageMetadata(page: Page, path: string) {
  const title = await page.title();
  expect(title.length, 'title present').toBeGreaterThan(0);
  expect(title.length, 'title <= 60 chars').toBeLessThanOrEqual(60);

  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveCount(1);
  const text = (await description.getAttribute('content')) ?? '';
  expect(text.length, 'description present').toBeGreaterThan(0);
  expect(text.length, 'description <= 160 chars').toBeLessThanOrEqual(160);

  const canonical = new URL(path, siteOrigin).href;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    canonical,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    canonical,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    title,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    text,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https?:\/\/.+/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  await expectSingleH1(page);
}

export async function expectSingleH1(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
}

/** Zero axe violations for WCAG 2.2 AA. */
export async function expectNoAxeViolations(page: Page) {
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    scan.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
