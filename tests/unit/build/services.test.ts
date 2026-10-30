import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { services } from '../../../src/content/services';
import {
  servicePages,
  servicesIntro,
} from '../../../src/content/service-pages';
import { siteOrigin } from '../../../site.config';

describe('built Services pages', () => {
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of [
    '/services/',
    ...services.map((service) => service.href),
  ]) {
    it(`${route} has unique metadata, sitemap inclusion and ordered breadcrumbs`, () => {
      const document = new Window().document;
      document.write(readFileSync(`dist${route}index.html`, 'utf8'));
      const title = document.title;
      const description = document
        .querySelector('meta[name="description"]')!
        .getAttribute('content')!;
      expect(titles.has(title)).toBe(false);
      expect(descriptions.has(description)).toBe(false);
      titles.add(title);
      descriptions.add(description);
      expect(sitemap).toContain(`${siteOrigin}${route}</loc>`);
      const data = JSON.parse(
        document.querySelector('script[type="application/ld+json"]')!
          .textContent,
      );
      const crumbs = (data['@graph'] ?? [data]).find(
        (item: Record<string, unknown>) => item['@type'] === 'BreadcrumbList',
      );
      expect(
        crumbs.itemListElement.map(
          (item: { position: number }) => item.position,
        ),
      ).toEqual(route === '/services/' ? [1, 2] : [1, 2, 3]);
      expect(crumbs.itemListElement.at(-1).item).toBe(`${siteOrigin}${route}`);
      if (route === '/services/')
        expect(description).toBe(servicesIntro.description);
      else {
        const service = services.find((item) => item.href === route)!;
        expect(data['@graph'][0]).toMatchObject({
          '@type': 'Service',
          name: service.label,
          description: servicePages[service.slug].description,
        });
        for (const text of servicePages[service.slug].process)
          expect(document.querySelector('main')!.textContent).toContain(text);
      }
    });
  }
});
