import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiceScene from '../../../src/components/sections/ServiceScene.astro';
import DispatchHero from '../../../src/components/sections/DispatchHero.astro';
import { services } from '../../../src/content/services';
import { serviceScenes } from '../../../src/content/service-scenes';
import { dispatchCopy } from '../../../src/content/dispatch';
import { primaryCta } from '../../../src/content/navigation';

const container = await AstroContainer.create();
describe('dispatch scenes', () => {
  it('covers all six services in deck order, with qualified cost copy', () => {
    expect(services.map(({ slug }) => slug)).toEqual([
      'process-automation',
      'ai-automation',
      'ai-cost-optimization',
      'cloud-devops',
      'websites-and-apps',
      'custom-software',
    ]);
    expect(Object.keys(serviceScenes)).toEqual(
      services.map(({ slug }) => slug),
    );
    expect(serviceScenes['ai-cost-optimization'].caption).toContain(
      'method, not a saving',
    );
  });
  it.each(services)(
    'renders $slug with a complete alternative and a hidden replay',
    async (service) => {
      const html = await container.renderToString(ServiceScene, {
        props: { variant: service.slug },
      });
      expect(html.replaceAll('&#39;', "'")).toContain(
        serviceScenes[service.slug].description,
      );
      expect(html).toContain('data-scene');
      expect(html).toContain('data-duration="1800"');
      expect(html).toContain('data-replay hidden');
      expect(html).toContain(`aria-label="Replay example: ${service.label}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toMatch(/style=|<script|<animate/);
      const nested = await container.renderToString(ServiceScene, {
        props: { variant: service.slug, standalone: false },
      });
      expect(nested).not.toMatch(/data-scene(?:[\s=>])|data-replay/);
    },
  );
  it('centres the promise with the configured CTA before the field', async () => {
    const html = await container.renderToString(DispatchHero);
    expect(html).toContain(dispatchCopy.title);
    expect(html.indexOf(`href="${primaryCta.href}"`)).toBeLessThan(
      html.indexOf('<figure'),
    );
    expect(html).toContain(dispatchCopy.description);
    expect(html).toContain('data-duration="2400"');
    expect(html).not.toMatch(/Design exploration|<script|style=/);
  });
});
