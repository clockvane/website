import { expect, test } from '@playwright/test';
import { bookingUrl, siteConfig } from '../../site.config';
import { newTabHint, primaryCta } from '../../src/content/navigation';
import { services } from '../../src/content/services';

/** Pages with a primary "Book a call" CTA (#177). */
const ctaPages = [
  '/',
  '/services/',
  '/services/expert-support/',
  '/services/ai-automation/',
  '/about/',
  '/how-we-work/',
  '/contact/',
];

test('the primary CTA points at the configured booking page', () => {
  expect(bookingUrl).toBe('https://meetings-na2.hubspot.com/clockvane');
  expect(primaryCta).toEqual({
    label: siteConfig.primaryCta.label,
    href: bookingUrl,
    newTab: true,
  });
  for (const service of services) expect(service.cta.href).toBe(bookingUrl);
});

for (const path of ctaPages) {
  test(`booking links on ${path} open in a new tab, say so, and embed nothing`, async ({
    page,
  }) => {
    await page.goto(path);
    const links = page.locator(`a[href="${primaryCta.href}"]`);
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      // Text, not accessible name: inactive service tab panels are hidden.
      await expect(link).toContainText(`(${newTabHint})`);
    }
    await expect(
      page.getByRole('banner').getByRole('link', {
        name: `${primaryCta.label} (${newTabHint})`,
        exact: true,
      }),
    ).toHaveAttribute('href', primaryCta.href);
    // No CTA is left pointing at the contact page as if it were the booking.
    await expect(page.locator('a.pill--primary[href="/contact/"]')).toHaveCount(
      0,
    );
    // Linked, never embedded: no HubSpot frame or script.
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('script[src*="hubspot"]')).toHaveCount(0);
  });
}

for (const width of [360, 1280]) {
  test(`the new-tab hint adds no layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const cta = page.locator('.hero a.pill--primary');
    const withHint = await cta.boundingBox();
    await cta.evaluate((el) => el.querySelector('.visually-hidden')?.remove());
    expect(await cta.boundingBox()).toEqual(withHint);
  });
}

test('the contact page keeps the form and offers the booking link', async ({
  page,
}) => {
  await page.goto('/contact/');
  const booking = page.locator('main [data-booking-link]');
  await expect(booking).toBeVisible();
  await expect(booking).toHaveAttribute('href', primaryCta.href);
  await expect(booking).toHaveAccessibleName(
    `${primaryCta.label} (${newTabHint})`,
  );
  await expect(page.locator('main form')).toBeVisible();
});
