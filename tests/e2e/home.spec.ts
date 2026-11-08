import { expect, test } from '@playwright/test';
import { aiDemo } from '../../src/content/ai-demo';
import { closingCta } from '../../src/content/sections';
import {
  hero,
  onePlace,
  problemSolution,
  stories,
} from '../../src/content/home';
import { serviceTabs } from '../../src/content/service-tabs';
import { homeSeo } from '../../src/content/site';
import { siteConfig, siteOrigin } from '../../site.config';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
} from './helpers/page-checks';

const h1 =
  'Get expert support, AI automation and websites built around your needs.';

test('sections follow the copy deck order without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const main = page.getByRole('main');
  const sequence = await main
    .locator('h1, h2, [data-marquee]')
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        node.hasAttribute('data-marquee')
          ? 'marquee'
          : (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ),
    );
  expect(sequence).toEqual([
    h1,
    'marquee',
    problemSolution.heading,
    'marquee',
    onePlace.heading,
    aiDemo.heading,
    closingCta.heading,
  ]);
  await expect(main).toContainText(siteConfig.tagline);
  await expect(main).toContainText(hero.lede);
  await expect(main).toContainText(
    `${problemSolution.body} ${problemSolution.solution}`,
  );
  await expect(main).toContainText(onePlace.intro);
  await context.close();
});

test('the four services link to their pages, and CTAs go where the deck says', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 3 })).toHaveText(
    serviceTabs.map(({ name }) => name),
  );
  const expected = {
    'Explore expert support': '/services/expert-support/',
    'Explore AI automation': '/services/ai-automation/',
    'Explore website creation': '/services/website-creation/',
    'Explore solutions for companies': '/services/solutions/',
    [hero.secondary.label]: '/services/',
    [problemSolution.link.label]: '/how-we-work/',
  };
  for (const [name, href] of Object.entries(expected)) {
    await expect(main.getByRole('link', { name, exact: true })).toHaveAttribute(
      'href',
      href,
    );
  }
  await expect(
    main.locator('.hero').getByRole('link', {
      name: siteConfig.primaryCta.label,
    }),
  ).toHaveAttribute('href', siteConfig.primaryCta.href);
  await context.close();
});

test('stories stay omitted until approved content exists', async ({ page }) => {
  expect(stories.items).toEqual([]);
  await page.goto('/');
  await expect(page.getByRole('main')).not.toContainText(stories.heading);
  await expect(page.getByRole('main')).not.toContainText('[[PLACEHOLDER');
});

test('SEO: unique metadata, Organization data from config, sitemap entry', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(homeSeo.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    homeSeo.description,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    homeSeo.title,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = JSON.parse(jsonLd ?? '{}') as Record<string, unknown>;
  expect(data).toMatchObject({
    '@type': 'Organization',
    name: siteConfig.brand,
    slogan: siteConfig.tagline,
    url: `${siteOrigin}/`,
  });
  expect(jsonLd).not.toContain('PLACEHOLDER');
  const sitemap = await page.request.get('/sitemap-0.xml');
  expect(await sitemap.text()).toContain(`<loc>${siteOrigin}/</loc>`);
});

test('reduced motion stops both marquees and shows the finished demo', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/js-motion/);
  await expect(page.locator('[data-marquee]')).toHaveCount(2);
  await expect(page.locator('[data-pause]:visible')).toHaveCount(0);
  for (const track of await page.locator('.track').all()) {
    expect(
      await track.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
  }
  await expect(page.locator('.group[aria-hidden="true"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-result]')).toBeVisible();
  await context.close();
});

test('marquees run with motion allowed and the button pauses them', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/js-motion/);
  const pause = page.locator('[data-pause]').first();
  await expect(pause).toBeVisible();
  await pause.click();
  await expect(pause).toHaveText('Resume examples');
  expect(
    await page
      .locator('.track')
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe('paused');
});

test('keyboard: tabs move with arrows and the panel link is reachable', async ({
  page,
}) => {
  await page.goto('/');
  const first = page.getByRole('tab', { name: serviceTabs[0]!.name });
  const second = page.getByRole('tab', { name: serviceTabs[1]!.name });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator(`#panel-${serviceTabs[1]!.key}`)).toBeVisible();
  const cta = page
    .locator(`#panel-${serviceTabs[1]!.key}`)
    .getByRole('link', { name: serviceTabs[1]!.cta.label });
  await cta.focus();
  expect(await cta.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    'solid',
  );
});

for (const width of [320, 768, 1440]) {
  test(`axe passes and nothing overflows at ${width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expectNoAxeViolations(page);
    await expectNoHorizontalScroll(page);
    await context.close();
  });
}
