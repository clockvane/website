import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const path = '/__design-system/';

test('motion on: passes axe, pause controls work, copies are hidden', async ({
  page,
}) => {
  await page.goto(path);
  await expect(page.locator('html')).toHaveClass(/js-motion/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.locator('[data-loop-copy]').first()).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  expect(
    await page.locator('[data-loop-copy] a, [data-loop-copy] button').count(),
  ).toBe(0);
  const pause = page.getByRole('button', { name: 'Pause examples' }).first();
  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Resume examples' }).first(),
  ).toBeVisible();
  const running = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              (a as CSSAnimation).animationName?.startsWith('marquee') &&
              a.playState === 'running',
          ).length,
    );
  expect(await running()).toBe(0);
});

test('reduced motion: nothing animates, the demo is finished and reachable', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(path);
  await expect(page.locator('html')).not.toHaveClass(/js-motion/);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator('[data-pause]').first()).toBeHidden();
  await expect(page.locator('[data-loop-copy]')).toHaveCount(0);
  await expect(page.locator('[data-demo-controls]')).toBeHidden();
  await expect(page.locator('.is-done')).toHaveCount(4);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await context.close();
});

test('no JavaScript: all panels stack and the demo is complete', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(path);
  await expect(page.getByRole('tablist')).toBeHidden();
  await expect(page.locator('section[id^="panel-"]:visible')).toHaveCount(4);
  await expect(page.getByText('Not sent', { exact: true })).toBeVisible();
  await context.close();
});

test('tabs work by keyboard with roving tabindex', async ({ page }) => {
  await page.goto(path);
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAttribute(
    'id',
    'panel-automation',
  );
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
});

test('demo plays in view, pauses on Escape, and replays', async ({ page }) => {
  await page.goto(path);
  await page.locator('[data-demo-stage]').scrollIntoViewIfNeeded();
  const demo = page.locator('[data-demo]');
  await expect(demo).toHaveAttribute('data-state', 'running');
  await page.locator('[data-demo-toggle]').focus();
  await page.keyboard.press('Escape');
  await expect(demo).toHaveAttribute('data-state', 'paused');
  await page.locator('[data-demo-replay]').click();
  await expect(demo).toHaveAttribute('data-state', 'running');
  await expect(demo).toHaveAttribute('data-state', 'done', { timeout: 9000 });
  await expect(page.locator('[data-demo-status]')).toHaveText(/not sent/);
});

test('images are optimised: AVIF, WebP fallback, srcset, dimensions, lazy', async ({
  page,
}) => {
  await page.goto(path);
  const picture = page.locator('[data-marquee] picture').first();
  await expect(picture.locator('source[type="image/avif"]')).toHaveAttribute(
    'srcset',
    /320w.*480w.*640w.*960w/,
  );
  const img = picture.locator('img');
  await expect(img).toHaveAttribute('src', /\.webp/);
  await expect(img).toHaveAttribute('sizes', /vw/);
  await expect(img).toHaveAttribute('loading', 'lazy');
  await expect(img).toHaveAttribute('width', /\d+/);
  await expect(img).toHaveAttribute('height', /\d+/);
});

test('demo spinner pauses off-screen and motion preference changes restore the finished draft', async ({
  page,
}) => {
  await page.goto(path);
  const stage = page.locator('[data-demo-stage]');
  await stage.scrollIntoViewIfNeeded();
  const spinner = page.locator('.step.is-active .dot');
  await expect(spinner).toHaveCSS('animation-play-state', 'running');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stage).toHaveAttribute('data-offscreen', '');
  await expect(spinner).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-demo-controls]')).toBeHidden();
  await expect(page.locator('.is-done')).toHaveCount(4);
  await expect(page.locator('[data-loop-copy]')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

for (const width of [320, 768, 1440]) {
  test(`no horizontal page overflow at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Full-page capture does not load below-fold lazy images. Decode them for evidence only.
    await page.locator('img').evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          if (!(image instanceof HTMLImageElement)) return;
          image.loading = 'eager';
          await image.decode();
        }),
      );
    });
    await page.screenshot({
      path: `.agentops-scratch/126-components-${width}.png`,
      fullPage: true,
    });
  });
}
