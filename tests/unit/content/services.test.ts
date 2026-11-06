import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { services, servicesOverview } from '../../../src/content/services';
import { services as navigation } from '../../../src/content/navigation';
import { serviceTabs } from '../../../src/content/service-tabs';
import { exampleIds } from '../../../src/content/examples';
import { siteConfig } from '../../../site.config';

const contentDir = new URL('../../../src/content/', import.meta.url);

describe('service content (change request 3)', () => {
  it('lists the four services in the brief order, shared with navigation', () => {
    expect(services.map(({ label }) => label)).toEqual([
      'Expert support',
      'AI automation',
      'Website creation',
      'Solutions for companies',
    ]);
    expect(navigation.map(({ label }) => label)).toEqual(
      services.map(({ label }) => label),
    );
    for (const service of services) {
      expect(service.href).toBe(`/services/${service.slug}/`);
      expect(service.summary.length).toBeGreaterThan(0);
    }
  });

  it('uses the copy deck routes, CTAs and SEO limits, each unique', () => {
    expect(services.map(({ slug }) => slug)).toEqual([
      'expert-support',
      'ai-automation',
      'website-creation',
      'solutions',
    ]);
    expect(services.map(({ cta }) => cta.label)).toEqual([
      'Book an expert',
      'Book a call',
      'Book a call',
      'Book a call',
    ]);
    const titles = [servicesOverview, ...services.map(({ seo }) => seo)].map(
      ({ title }) => title,
    );
    const descriptions = [
      servicesOverview,
      ...services.map(({ seo }) => seo),
    ].map(({ description }) => description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const title of titles) {
      expect(
        `${title} | ${siteConfig.brand}`.length,
        title,
      ).toBeLessThanOrEqual(60);
    }
    for (const description of descriptions) {
      expect(description.length, description).toBeLessThanOrEqual(155);
    }
  });

  it('gives every service page a complete, placeholder-free set of blocks', () => {
    for (const service of services) {
      expect(service.what.bullets.length).toBeGreaterThan(0);
      expect(service.process.steps.length).toBeGreaterThan(0);
      expect(service.example.screens.length).toBeGreaterThan(0);
      expect(JSON.stringify(service)).not.toContain('[[PLACEHOLDER');
    }
  });

  it('renders every example screen on a service page or the overview', () => {
    // A source no page renders ships as a PNG, which the dist budgets reject (examples.ts).
    const rendered = new Set<string>([
      ...services.flatMap(({ example, thumbs }) => [
        ...example.screens,
        ...thumbs.slice(0, 2),
      ]),
      'wide-studio',
      'wide-flows',
      'wide-board',
      'wide-orders',
    ]);
    expect(exampleIds.filter((id) => !rendered.has(id))).toEqual([]);
  });

  it('shares its wording with the home tabs', () => {
    expect(serviceTabs.map(({ name }) => name)).toEqual(
      services.map(({ label }) => label),
    );
    expect(serviceTabs[3]?.link.href).toBe('/services/solutions/');
  });

  it('never describes clients by size or plays on the company name', () => {
    for (const file of readdirSync(contentDir)) {
      const text = readFileSync(new URL(file, contentDir), 'utf8');
      expect(text, file).not.toMatch(
        /small business|startup|clockwork|\bvane\b|\bgears?\b|clock tower/i,
      );
    }
  });
});
