import { expect, test } from '@playwright/test';
import { accessibilityCopy } from '../../src/content/accessibility';
import { siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

test('footer links to the accessibility statement, which renders the approved copy', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Accessibility', exact: true })
    .click();
  await expect(page).toHaveURL(/\/accessibility\/$/);
  await expect(page).toHaveTitle(accessibilityCopy.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    accessibilityCopy.heading,
  );
  for (const section of accessibilityCopy.sections) {
    await expect(
      main.getByRole('heading', { name: section.heading, exact: true }),
    ).toBeVisible();
  }
  await expect(main).toContainText('WCAG) 2.2 at level AA');
  await expect(page.locator('body')).not.toContainText('PLACEHOLDER');
  await expect(page.locator('body')).not.toContainText(/certified/i);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(
    main.getByRole('link', { name: 'contact form' }),
  ).toHaveAttribute('href', '/contact/');
});

test('accessibility statement has no axe violations and no horizontal scroll', async ({
  page,
}) => {
  await page.goto('/accessibility/');
  await expectNoAxeViolations(page);
  await expectNoHorizontalScroll(page);
});

test('sitemap includes the accessibility statement', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  const locations = [...(await index.text()).matchAll(/<loc>(.*?)<\/loc>/g)];
  let sitemap = '';
  for (const location of locations) {
    const response = await request.get(new URL(location[1]!).pathname);
    sitemap += await response.text();
  }
  expect(sitemap).toContain(`<loc>${siteOrigin}/accessibility/</loc>`);
});
