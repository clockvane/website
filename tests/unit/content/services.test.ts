import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { services } from '../../../src/content/services';
import { services as navigation } from '../../../src/content/navigation';

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

  it('never describes clients by size or plays on the company name', () => {
    for (const file of readdirSync(contentDir)) {
      const text = readFileSync(new URL(file, contentDir), 'utf8');
      expect(text, file).not.toMatch(
        /small business|startup|clockwork|\bvane\b|\bgears?\b|clock tower/i,
      );
    }
  });
});
