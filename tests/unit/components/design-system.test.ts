import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AiDemo from '../../../src/components/sections/AiDemo.astro';
import CtaBand from '../../../src/components/sections/CtaBand.astro';
import Marquee from '../../../src/components/sections/Marquee.astro';
import ServiceTabs from '../../../src/components/sections/ServiceTabs.astro';
import StoryPlaceholders from '../../../src/components/sections/StoryPlaceholders.astro';
import TokenHeadline from '../../../src/components/sections/TokenHeadline.astro';
import ServiceToken from '../../../src/components/ui/ServiceToken.astro';
import { aiDemo } from '../../../src/content/ai-demo';
import { serviceTabs } from '../../../src/content/service-tabs';
import { exampleIds, example } from '../../../src/content/examples';

const container = await AstroContainer.create();
const render = container.renderToString.bind(container);

describe('design system v3 components', () => {
  it('has a source image and a visible example label for every screen', () => {
    for (const id of exampleIds) {
      const { src, label, alt } = example(id);
      expect(src.width).toBeLessThanOrEqual(1600);
      expect(label).toMatch(/example/i);
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  it('hides service tokens from assistive technology', async () => {
    const html = await render(ServiceToken, { props: { service: 'expert' } });
    expect(html).toContain('aria-hidden="true"');
  });

  it('keeps the headline a complete sentence around its tokens', async () => {
    const html = await render(TokenHeadline, {
      props: {
        lines: [['Get ', { text: 'support,', service: 'expert' }], ['now.']],
      },
    });
    expect(html).toMatch(/<h1/);
    expect(html).toContain('support,');
    expect(html.match(/<br/g)).toHaveLength(1);
    expect(html).toContain('tok--expert');
  });

  it('marquee HTML has no duplicates, a hidden pause button and a named group', async () => {
    const html = await render(Marquee, {
      props: {
        id: 'm',
        label: 'Example screens',
        tracks: [['web-clear'], ['ai-run']],
      },
    });
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-describedby="m-note"');
    expect(html).toMatch(/data-pause[^>]*hidden/);
    expect(html).not.toContain('data-loop-copy');
    expect(html.match(/<figure/g)).toHaveLength(2);
    expect(html).toContain('Example website');
  });

  it('tabs ship a hidden tablist and stacked panels with no panel role', async () => {
    const html = await render(ServiceTabs, {
      props: { tabs: serviceTabs, label: 'Services' },
    });
    expect(html).toMatch(/role="tablist"[^>]*hidden/);
    expect(html).not.toContain('role="tabpanel"');
    expect(html.match(/<h3/g)).toHaveLength(4);
    expect(html.match(/<figure/g)).toHaveLength(12);
  });

  it('demo HTML is the finished draft with hidden controls and a text alternative', async () => {
    const html = await render(AiDemo);
    expect(html).toMatch(/data-demo-controls[^>]*hidden/);
    expect(html).toContain(aiDemo.textAlternative);
    expect(html).toContain('aria-live="polite"');
    expect(html.match(/is-done/g)).toHaveLength(aiDemo.steps.length);
    expect(html).not.toContain('is-waiting');
  });

  it('stories render nothing when empty, so nothing fake ever ships', async () => {
    const empty = await render(StoryPlaceholders, {
      props: { heading: 'Stories', stories: [] },
    });
    expect(empty).not.toContain('<section');
    const held = await render(StoryPlaceholders, {
      props: {
        heading: 'Stories',
        stories: [
          { title: '[[PLACEHOLDER: t]]', body: 'b', placeholder: true },
        ],
      },
    });
    expect(held).toContain('Placeholder');
  });

  it('closing band has four tokens, one heading and one primary action', async () => {
    const html = await render(CtaBand);
    expect(html.match(/class="tok /g)).toHaveLength(4);
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html.match(/pill--primary/g)).toHaveLength(1);
  });
});
