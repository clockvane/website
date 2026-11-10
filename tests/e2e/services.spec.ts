import { expect, test } from '@playwright/test';
import { primaryCta } from '../../src/content/navigation';
import { services, servicesOverview } from '../../src/content/services';
import { helpChoose } from '../../src/content/sections';
import { siteConfig, siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

const paths = [servicesOverview.href, ...services.map(({ href }) => href)];

async function expectUnclippedCaptions(page: import('@playwright/test').Page) {
  const captions = page.locator('.stage figcaption, .gallery figcaption');
  expect(await captions.count()).toBeGreaterThan(0);
  for (const caption of await captions.all()) {
    await caption.scrollIntoViewIfNeeded();
    const bounds = await caption.evaluate((element) => {
      const figure = element.closest('figure')!.getBoundingClientRect();
      const label = element.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      return {
        figure: figure.toJSON(),
        label: label.toJSON(),
        text: text.toJSON(),
      };
    });
    for (const rect of [bounds.label, bounds.text]) {
      expect(rect.top).toBeGreaterThanOrEqual(bounds.figure.top - 1);
      expect(rect.bottom).toBeLessThanOrEqual(bounds.figure.bottom + 1);
      expect(rect.left).toBeGreaterThanOrEqual(bounds.figure.left - 1);
      expect(rect.right).toBeLessThanOrEqual(bounds.figure.right + 1);
    }
  }
}

async function breadcrumbNames(page: import('@playwright/test').Page) {
  const json = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = JSON.parse(json ?? '{}') as {
    '@type': string;
    itemListElement: { name: string; item: string }[];
  };
  expect(data['@type']).toBe('BreadcrumbList');
  return data.itemListElement;
}

test('overview presents the four services in one place with thumbnails', async ({
  page,
}) => {
  await page.goto(servicesOverview.href);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    servicesOverview.heading,
  );
  const jump = main.getByRole('navigation', {
    name: servicesOverview.jumpLabel,
  });
  await expect(jump.getByRole('link')).toHaveText(
    services.map(({ label }) => label),
  );
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([
    ...services.map(({ label }) => label),
    helpChoose.heading,
    'What would you like to get done?',
  ]);
  for (const service of services) {
    const block = main.locator(`#${service.slug}`);
    await expect(block).toContainText(service.summary);
    await expect(block).toContainText(service.overview.what);
    await expect(block).toContainText(service.overview.how);
    await expect(block).toContainText(service.audience);
    await expect(block.locator('.stage img')).toHaveCount(2);
    await expect(
      block.getByRole('link', { name: service.cta.label }),
    ).toHaveAttribute('href', primaryCta.href);
    await expect(
      block.getByRole('link', { name: service.linkLabel }),
    ).toHaveAttribute('href', service.href);
  }
  await jump.getByRole('link', { name: services[2]!.label }).click();
  await expect(page).toHaveURL(new RegExp(`#${services[2]!.slug}$`));
  await expect(main.locator(`#${services[2]!.slug}`)).toBeInViewport();
});

for (const service of services) {
  test(`${service.slug} follows the template, with its own call to action`, async ({
    page,
  }) => {
    await page.goto(service.href);
    await expect(page).toHaveTitle(
      `${service.seo.title} | ${siteConfig.brand}`,
    );
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      service.what.heading,
      service.process.heading,
      service.audienceBlock.heading,
      service.example.heading,
      service.closing.heading,
    ]);
    const breadcrumb = main.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('link')).toHaveText(['Home', 'Services']);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      service.label,
    );
    for (const item of service.what.bullets) {
      await expect(main.getByText(item, { exact: true })).toBeVisible();
    }
    for (const step of service.process.steps) {
      await expect(main.getByText(step, { exact: true })).toBeVisible();
    }
    await expect(main.getByText(service.example.caption)).toBeVisible();
    await expect(main.locator('.gallery img')).toHaveCount(
      service.example.screens.length,
    );
    await expect(main.locator('.gallery figcaption')).toHaveCount(
      service.example.screens.length,
    );
    await expect(main.locator('[data-demo]')).toHaveCount(
      service.example.demo ? 1 : 0,
    );
    await expect(
      main.getByRole('region', { name: service.example.heading, exact: true }),
    ).toHaveCount(1);
    const cta = main.locator('.band-wrap a');
    await expect(cta).toContainText(service.cta.label);
    await expect(cta).toHaveAttribute('href', service.cta.href);
    await expect(cta).toHaveAttribute('target', '_blank');
  });
}

test('every page has breadcrumb data, a canonical URL and a sitemap entry; old routes are gone', async ({
  page,
}) => {
  const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
  for (const path of paths) {
    await page.goto(path);
    const canonical = `${siteOrigin}${path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonical,
    );
    expect((await breadcrumbNames(page)).at(-1)?.item).toBe(canonical);
    expect(sitemap).toContain(`<loc>${canonical}</loc>`);
  }
  expect(sitemap).not.toContain('solutions-for-companies');
  const old = await page.request.get('/services/solutions-for-companies/');
  expect(old.status()).toBe(404);
});

for (const width of [320, 768, 1280]) {
  for (const path of paths) {
    test(`${path} at ${width}px: axe, reflow, keyboard, reduced motion, no JavaScript`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expectNoAxeViolations(page);
      await expectNoHorizontalScroll(page);
      await expectUnclippedCaptions(page);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
      const cta = page.locator('main .band-wrap a');
      await cta.focus();
      expect(
        await cta.evaluate((element) => getComputedStyle(element).outlineStyle),
      ).toBe('solid');
      // Reduced motion: nothing loops, and the marquee stays in its stopped layout.
      await expect(page.locator('.js-motion')).toHaveCount(0);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await expectNoHorizontalScroll(page);
      await expectUnclippedCaptions(page);
      await context.close();

      const noJs = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width, height: 900 },
      });
      const noJsPage = await noJs.newPage();
      await noJsPage.goto(path);
      await expect(noJsPage.locator('main .band-wrap a')).toBeVisible();
      await expectNoHorizontalScroll(noJsPage);
      await noJs.close();
    });
  }
}
