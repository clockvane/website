import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { siteConfig } from '../../site.config';
import { handleEnquiry } from '../../src/lib/contact/handler';
import { csp } from '../../infra/headers/render';

async function endpoint(page: Page, status = 200) {
  await page.route(siteConfig.contact.endpoint, async (route) => {
    const incoming = route.request();
    const origin = new URL(page.url()).origin;
    const response = await handleEnquiry(
      new Request(incoming.url(), {
        method: incoming.method(),
        headers: incoming.headers(),
        body: incoming.postData(),
      }),
      {
        siteOrigin: origin,
        now: () => Date.now() + 3000,
        allowRequest: async () => status !== 429,
        deliver: async () => status === 200,
      },
    );
    await route.fulfill({
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': origin,
      },
      body: await response.text(),
    });
  });
}
async function fill(page: Page) {
  await page.getByLabel('Your name (required)').fill('Alex');
  await page.getByLabel('Email or phone (required)').fill('alex@example.test');
  await page
    .getByLabel('What would you like off your plate? (required)')
    .fill('Please automate our daily order entry.');
}
async function axe(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test('validation links errors, keeps input and focuses summary and fields', async ({
  page,
}) => {
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('[data-errors]')).toBeFocused();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
  await page.locator('[data-errors] a').first().click();
  await expect(page.getByLabel('Your name (required)')).toBeFocused();
  await fill(page);
  await page.getByLabel('Email or phone (required)').fill('bad@example');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('#reply-error')).toBeVisible();
  await expect(page.getByLabel('Your name (required)')).toHaveValue('Alex');
  await axe(page);
});

test('success replaces form and moves focus under the strict CSP', async ({
  page,
}) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/content security policy|violates.*directive/i.test(message.text()))
      violations.push(message.text());
  });
  await page.route('**/contact/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'Content-Security-Policy': csp(
          new URL(siteConfig.contact.endpoint).origin,
        ),
      },
    });
  });
  await endpoint(page);
  await page.goto('/contact/');
  await fill(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Message sent', exact: true }),
  ).toBeFocused();
  await expect(page.locator('form')).toBeHidden();
  await expect(page.locator('h1')).toHaveCount(1);
  expect(violations).toEqual([]);
  await axe(page);
});

test('character guidance helps visitors correct a message and send it', async ({
  page,
}) => {
  await endpoint(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/contact/');
  await fill(page);
  const message = page.getByLabel(
    'What would you like off your plate? (required)',
  );
  const send = page.getByRole('button', { name: 'Send message', exact: true });
  const guidance =
    'Replace < and > in your message with words such as “less than” or “over”. Retype any pasted text to remove hidden characters.';
  await message.fill('Flag orders > 100 for review.');
  await send.focus();
  await expect(page.locator('#message-error')).toContainText(guidance);
  await expect(send).toBeFocused();
  await send.click();
  await expect(page.locator('[data-errors]')).toBeFocused();
  const correction = page.locator('[data-errors] a[href="#contact-message"]');
  await expect(correction).toContainText(guidance);
  await expect(message).toHaveAttribute(
    'aria-describedby',
    'message-hint message-error',
  );
  await axe(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.agentops-scratch/61-character-guidance-320.png',
    fullPage: true,
  });
  await correction.click();
  await expect(message).toBeFocused();
  await message.fill('Flag orders over 100 for review.');
  await send.focus();
  await expect(page.locator('#message-error')).toBeHidden();
  await send.click();
  await expect(
    page.getByRole('heading', { name: 'Message sent', exact: true }),
  ).toBeFocused();
});

for (const status of [502, 429])
  test(`delivery ${status} keeps input and allows retry`, async ({ page }) => {
    await endpoint(page, status);
    await page.goto('/contact/');
    await fill(page);
    await page
      .getByRole('button', { name: 'Send message', exact: true })
      .click();
    await expect(page.locator('[data-failure]')).toBeFocused();
    await expect(page.getByLabel('Your name (required)')).toHaveValue('Alex');
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('button[type="submit"]')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    if (status === 429)
      await expect(page.locator('[data-failure]')).toContainText(
        'Please wait a few minutes',
      );
    await axe(page);
    await endpoint(page);
    await page
      .getByRole('button', { name: 'Send message', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Message sent', exact: true }),
    ).toBeFocused();
  });

test('network failure retains text and restores controls', async ({ page }) => {
  await page.route(siteConfig.contact.endpoint, (route) => route.abort());
  await page.goto('/contact/');
  await fill(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('[data-failure]')).toBeFocused();
  await expect(page.getByLabel('Your name (required)')).toHaveValue('Alex');
  await expect(page.getByLabel('Your name (required)')).not.toHaveAttribute(
    'readonly',
  );
});

test('sending locks fields, announces status and prevents duplicate requests', async ({
  page,
}) => {
  let submissions = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(siteConfig.contact.endpoint, async (route) => {
    submissions++;
    await pending;
    await route.fulfill({
      json: { ok: true },
      headers: { 'Access-Control-Allow-Origin': new URL(page.url()).origin },
    });
  });
  await page.goto('/contact/');
  await fill(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Sending your message.');
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByLabel('Your name (required)')).toHaveAttribute(
    'readonly',
    '',
  );
  await page.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  expect(submissions).toBe(1);
  release();
  await expect(
    page.getByRole('heading', { name: 'Message sent', exact: true }),
  ).toBeFocused();
});

test('server field errors are linked and focused even after client validation passed', async ({
  page,
}) => {
  await page.route(siteConfig.contact.endpoint, (route) =>
    route.fulfill({
      status: 400,
      json: {
        fields: {
          reply: 'Enter an email address or phone number so we can reply.',
        },
      },
      headers: { 'Access-Control-Allow-Origin': new URL(page.url()).origin },
    }),
  );
  await page.goto('/contact/');
  await fill(page);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.locator('[data-errors]')).toBeFocused();
  await expect(page.getByLabel('Email or phone (required)')).toHaveAttribute(
    'aria-describedby',
    'reply-hint reply-error',
  );
  await expect(page.getByLabel('Your name (required)')).toHaveValue('Alex');
});

for (const status of [200, 502])
  test(`native POST redirects without JavaScript: ${status}`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await endpoint(page, status);
    await page.goto(`${baseURL}/contact/`);
    await page
      .getByRole('button', { name: 'Send message', exact: true })
      .click();
    expect(
      await page
        .locator('input[name="name"]')
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing),
    ).toBe(true);
    await fill(page);
    await page
      .getByRole('button', { name: 'Send message', exact: true })
      .click();
    await expect(page).toHaveURL(
      `${baseURL}/contact/${status === 200 ? 'thanks' : 'error'}/`,
    );
    if (status === 502)
      await expect(page.locator('main')).toContainText(
        'has not kept your text',
      );
    await context.close();
  });

for (const width of [320, 1280])
  test(`contact routes: axe, targets, reflow and evidence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/contact/', '/contact/thanks/', '/contact/error/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await axe(page);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).not.toContainText('PLACEHOLDER');
      if (path !== '/contact/')
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex, follow',
        );
      for (const control of await page
        .locator('a:visible, button:visible, input:visible, textarea:visible')
        .all()) {
        const box = await control.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({
        path: `.agentops-scratch/61-${path.split('/')[2] || 'contact'}-${width}.png`,
        fullPage: true,
      });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
    }
    const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
    expect(sitemap).toContain('/contact/</loc>');
    expect(sitemap).not.toMatch(/contact\/(thanks|error)/);
  });
