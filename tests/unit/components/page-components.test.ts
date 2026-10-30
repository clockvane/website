import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PageHeader from '../../../src/components/sections/PageHeader.astro';
import ServiceRows from '../../../src/components/sections/ServiceRows.astro';
import ProcessSteps from '../../../src/components/sections/ProcessSteps.astro';
import CtaBand from '../../../src/components/sections/CtaBand.astro';
import WorkflowDiagram from '../../../src/components/sections/WorkflowDiagram.astro';
import ResultPanel from '../../../src/components/sections/ResultPanel.astro';
import Card from '../../../src/components/ui/Card.astro';
import { services } from '../../../src/content/services';
import { servicePages } from '../../../src/content/service-pages';
import { services as navigation } from '../../../src/content/navigation';
import { helpChoose, homeProcess } from '../../../src/content/sections';

const container = await AstroContainer.create();

describe('shared page components', () => {
  it('omits absent optional header content and exposes a plain current breadcrumb', async () => {
    const minimal = await container.renderToString(PageHeader, {
      props: { title: 'Services' },
    });
    expect(minimal).toContain('<h1');
    expect(minimal).not.toMatch(/<nav|<p|<a /);
    const full = await container.renderToString(PageHeader, {
      props: {
        title: 'Services',
        lede: 'Choose a service',
        breadcrumbs: [{ label: 'Home', href: '/' }],
        action: { label: 'Contact', href: '/contact/' },
      },
    });
    expect(full).toContain('aria-label="Breadcrumb"');
    expect(full).toMatch(/<li aria-current="page"[^>]*>Services<\/li>/);
    expect(full).toContain('href="/contact/"');
  });

  it('shares service order with navigation, changes heading levels and work lists by variant', async () => {
    expect(navigation).toEqual(
      services.map(({ href, label }) => ({ href, label })),
    );
    for (const variant of ['home', 'overview'] as const) {
      const html = await container.renderToString(ServiceRows, {
        props: { variant },
      });
      expect(html.match(/class="service-row"/g)).toHaveLength(6);
      let previous = -1;
      for (const service of services) {
        const position = html.indexOf(service.label);
        expect(position).toBeGreaterThan(previous);
        previous = position;
        expect(html).toContain(`href="${service.href}"`);
        expect(html).toContain(
          variant === 'home'
            ? service.summary
            : servicePages[service.slug].summary,
        );
        if (variant === 'overview')
          expect(html).toContain(servicePages[service.slug].workflow);
      }
      expect(html).toContain(variant === 'home' ? '<h3' : '<h2');
      expect(html.includes('Typical work')).toBe(variant === 'overview');
    }
  });

  it('omits empty process/card content and renders optional outputs and explicit links', async () => {
    expect(
      await container.renderToString(ProcessSteps, { props: { steps: [] } }),
    ).not.toContain('<ol');
    expect(await container.renderToString(Card)).not.toContain('<div');
    const process = await container.renderToString(ProcessSteps, {
      props: {
        steps: [
          ...homeProcess,
          { title: 'Output', body: 'Body', output: 'You get the documents.' },
        ],
        variant: 'home',
      },
    });
    expect(process).toContain('process-home');
    expect(process.match(/<li /g)).toHaveLength(5);
    expect(process).toContain('You get the documents.');
    const card = await container.renderToString(Card, {
      props: {
        title: 'Next steps',
        headingLevel: 'h2',
        body: 'Read the plan.',
        link: { label: 'Home', href: '/' },
      },
    });
    expect(card).toContain('<h2');
    expect(card).toContain('href="/"');
    expect(card).not.toContain('tabindex');
    expect(
      await container.renderToString(Card, {
        slots: { default: '<ol><li>A step</li></ol>' },
      }),
    ).toContain('<ol>');
  });

  it('uses one closing band for the help-choose content', async () => {
    const html = await container.renderToString(CtaBand, {
      props: { content: helpChoose },
    });
    expect(html).toContain(helpChoose.heading);
    expect(html.match(/<section /g)).toHaveLength(1);
    expect(html).not.toContain('Tell us about one slow process');
    expect(await container.renderToString(CtaBand)).toContain(
      'Tell us about one slow process',
    );
  });

  it('provides one adjacent diagram alternative, even with multiple instances', async () => {
    const props = {
      labels: [['Code'], ['Test'], ['Release']],
      description: 'Code is tested and released after approval.',
    };
    const html = (
      await container.renderToString(WorkflowDiagram, { props })
    ).repeat(2);
    expect(html.match(/<figcaption/g)).toHaveLength(2);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(html).not.toMatch(/style=|<style|\sid=|tabindex|role="img"/);
  });

  it('uses a page h1 or focusable inline h2, with optional result actions', async () => {
    const props = { title: 'Message sent', body: 'We have your message.' };
    const page = await container.renderToString(ResultPanel, { props });
    expect(page).toContain('<h1');
    expect(page).not.toMatch(/tabindex|class="actions"/);
    const inline = await container.renderToString(ResultPanel, {
      props: {
        ...props,
        inline: true,
        actions: [{ href: '/', label: 'Home' }],
      },
    });
    expect(inline).toMatch(/<h2 tabindex="-1"/);
    expect(inline).toContain('href="/"');
  });
});
