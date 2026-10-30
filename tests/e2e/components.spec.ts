import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 768, 1024, 1440]) {
  test(`page components reflow, expose links and pass axe at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/__components/');
    await page.evaluate(() => document.fonts.ready);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await expect(page.locator('script, [style], svg style')).toHaveCount(0);
    await expect(
      page.locator('main [tabindex="0"], main button:visible'),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .locator('[aria-current="page"]'),
    ).toHaveText('Services');
    const diagrams = page.locator('.workflow');
    await expect(diagrams.first().locator('.workflow-horizontal')).toBeVisible({
      visible: width >= 1024,
    });
    await expect(diagrams.last().locator('.workflow-vertical')).toBeVisible();
    await expect(page.locator('main ol.process-home > li')).toHaveCount(4);
    await page.locator('main').focus();
    for (const link of await page.locator('main a').all()) {
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      const box = (await link.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(
        await link.evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe('solid');
      await expect(link).toBeInViewport();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `.agentops-scratch/65-components-${width}.png`,
      fullPage: true,
    });
    const illustrations = page.locator('.workflow-illustration');
    await expect(illustrations).toHaveCount(6);
    for (const illustration of await illustrations.all()) {
      await expect(illustration.locator('figcaption')).toBeVisible();
    }
    const comparison = page.locator(
      '.illustration-examples .illustration-comparison',
    );
    expect(
      await comparison.evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
      ),
    ).toBe(width >= 1024 ? 2 : 1);
    expect(
      await page
        .locator('.narrow-diagram .illustration-comparison')
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
        ),
    ).toBe(1);
    for (const variant of ['before-after', 'branching', 'connected-tools']) {
      if (width === 320 || width === 1440) {
        await page
          .locator(`.illustration-examples [data-variant="${variant}"]`)
          .screenshot({
            path: `.agentops-scratch/75-${variant}-${width}.png`,
          });
      }
    }
    for (const enlarged of [false, true]) {
      if (enlarged)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const node of await illustrations.locator('.node').all()) {
        expect(
          await node.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
        expect(
          await node.evaluate((el) =>
            Number.parseFloat(getComputedStyle(el).fontSize),
          ),
        ).toBeGreaterThanOrEqual(enlarged ? 32 : 16);
      }
      for (const svg of await page
        .locator('.workflow-canvas > svg:visible')
        .all()) {
        const labelsFit = await svg.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          return [...el.querySelectorAll('text')].every((text) => {
            const box = text.getBoundingClientRect();
            return (
              box.left >= bounds.left &&
              box.right <= bounds.right &&
              Number.parseFloat(getComputedStyle(text).fontSize) >=
                Number.parseFloat(
                  getComputedStyle(document.documentElement).fontSize,
                )
            );
          });
        });
        expect(labelsFit).toBe(true);
      }
    }
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.locator('.closing-grid a').focus();
    expect(
      await page
        .locator('.closing-grid a')
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
  });
}

test('fixture remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/__components/');
  await expect(page.locator('main h1')).toHaveText('Services');
  await expect(page.locator('figcaption')).toHaveCount(20);
  await expect(page.locator('.workflow-illustration figcaption')).toHaveCount(
    6,
  );
  await expect(page.locator('.closing-grid a')).toHaveAttribute(
    'href',
    '/contact/',
  );
  await context.close();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`dispatch scenes are readable and pass axe at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/__motion/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-scene]')).toHaveCount(7);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await expect(
      page.locator(
        '[style], [onload], script:not([src]):not([type="application/ld+json"])',
      ),
    ).toHaveCount(0);
    for (const enlarged of [false, true]) {
      if (enlarged)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const label of await page
        .locator('.scene-labels span, .tool')
        .all()) {
        expect(
          await label.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize),
          ),
        ).toBeGreaterThanOrEqual(enlarged ? 32 : 16);
        expect(
          await label.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-replay]:visible')).toHaveCount(0);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    if (width === 320 || width === 1440)
      await page.screenshot({
        path: `.agentops-scratch/103-scenes-${width}.png`,
        fullPage: true,
      });
  });
}

test('first service plays, pauses offscreen and in hidden tabs, completes, replays and handles Escape', async ({
  page,
}) => {
  await page.goto('/__motion/');
  const scene = page.locator('.service-row').first();
  const replay = scene.getByRole('button');
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(scene).toHaveAttribute('data-state', 'paused');
  const progress = await scene.evaluate((el) =>
    el.getAnimations({ subtree: true }).map((animation) => ({
      state: animation.playState,
      time: animation.currentTime,
    })),
  );
  expect(progress.length).toBeGreaterThan(0);
  expect(progress.every(({ state }) => state === 'paused')).toBe(true);
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-state', 'paused');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(scene).toHaveAttribute('data-state', 'done');
  await replay.focus();
  await replay.press('Enter');
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await expect(replay).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(scene).toHaveAttribute('data-state', 'done');
  await expect(replay).toBeFocused();
  await expect(replay).toHaveAttribute('aria-disabled', 'false');
});

for (const mode of ['no-js', 'save-data', 'no-observer'] as const) {
  test(`dispatch fallback: ${mode}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: mode !== 'no-js',
      viewport: { width: 320, height: 900 },
    });
    if (mode === 'save-data')
      await context.addInitScript(() =>
        Object.defineProperty(navigator, 'connection', {
          value: Object.assign(new EventTarget(), { saveData: true }),
        }),
      );
    if (mode === 'no-observer')
      await context.addInitScript(() =>
        Object.defineProperty(window, 'IntersectionObserver', {
          value: undefined,
        }),
      );
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/__motion/');
    await expect(page.locator('[data-replay]:visible')).toHaveCount(0);
    await expect(page.locator('figcaption')).toHaveCount(7);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    if (mode !== 'no-js')
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}
