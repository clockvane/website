import { expect, test } from '@playwright/test';
import { siteOrigin } from '../../site.config';
import { routes } from './helpers/page-checks';

/** Pages that are deliberately outside the sitemap (noindex or error pages). */
const unlisted = ['/contact/thanks/', '/contact/error/', '/404.html'];

async function sitemapPaths(
  request: import('@playwright/test').APIRequestContext,
) {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const paths: string[] = [];
  for (const file of index.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const xml = await (await request.get(new URL(file[1]!).pathname)).text();
    for (const loc of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      paths.push(loc[1]!.replace(siteOrigin, ''));
    }
  }
  return paths;
}

test('every sitemap route is in the shared route list (new pages get covered)', async ({
  request,
}) => {
  const paths = await sitemapPaths(request);
  expect(paths.length).toBeGreaterThan(0);
  expect([...paths].sort()).toEqual([...routes].sort());
});

test('every page has a unique title, description and og:title', async ({
  request,
}) => {
  const seen = { title: new Set<string>(), description: new Set<string>() };
  for (const path of [...routes, ...unlisted]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(
      /<meta name="description" content="([^"]+)"/,
    )?.[1];
    expect(title, `${path} title`).toBeTruthy();
    expect(description, `${path} description`).toBeTruthy();
    expect(html, `${path} og:title`).toMatch(/<meta property="og:title"/);
    expect(seen.title.has(title!), `duplicate title on ${path}`).toBe(false);
    expect(
      seen.description.has(description!),
      `duplicate description on ${path}`,
    ).toBe(false);
    seen.title.add(title!);
    seen.description.add(description!);
  }
});

test('v2 concepts are gone: six services and removed routes', async ({
  request,
}) => {
  const home = await (await request.get('/')).text();
  expect(home).not.toMatch(/\bsix services\b/i);
  const overview = await (await request.get('/services/')).text();
  expect(
    new Set(overview.match(/href="\/services\/[a-z-]+\/"/g)),
  ).toHaveProperty('size', 4);
});
