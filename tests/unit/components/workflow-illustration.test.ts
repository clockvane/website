import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WorkflowIllustration from '../../../src/components/sections/WorkflowIllustration.astro';
import {
  processAutomationDescription,
  workflowIllustrations,
} from '../../../src/content/workflow-illustrations';

const container = await AstroContainer.create();

describe('workflow illustrations', () => {
  it.each(['before-after', 'branching', 'connected-tools'] as const)(
    '%s exposes one equivalent caption and no interactive or duplicate SVG alternatives',
    async (variant) => {
      const html = await container.renderToString(WorkflowIllustration, {
        props: { variant },
      });
      expect(html.match(/<figcaption/g)).toHaveLength(1);
      expect(html).toContain(workflowIllustrations[variant].description);
      expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
      expect(html).not.toMatch(/<script|style=|\sid=|tabindex|role="img"/);
    },
  );

  it('compares the same tools with manual copying and automatic movement', async () => {
    const html = await container.renderToString(WorkflowIllustration, {
      props: { variant: 'before-after' },
    });
    expect(html).toContain('Before: manual copying between tools');
    expect(html).toContain('After: automatic data movement');
    for (const tool of workflowIllustrations['before-after'].tools) {
      expect(html.split(`>${tool}</span>`)).toHaveLength(3);
    }
    expect(html.match(/class="person"/g)).toHaveLength(3);
    expect(html.indexOf('Before:')).toBeLessThan(html.indexOf('After:'));
  });

  it('routes clear results to the spreadsheet and unclear ones to a person', async () => {
    const html = await container.renderToString(WorkflowIllustration, {
      props: { variant: 'branching' },
    });
    expect(html).toMatch(/Document[\s\S]*AI step[\s\S]*Clear/);
    expect(html).toMatch(/Clear<\/p>[\s\S]*Spreadsheet<\/div>/);
    expect(html).toMatch(/Unclear<\/p>[\s\S]*Person to check<\/div>/);
    expect(html.match(/class="branch"/g)).toHaveLength(2);
  });

  it('connects three separate tools to the same custom service', async () => {
    const html = await container.renderToString(WorkflowIllustration, {
      props: { variant: 'connected-tools' },
    });
    expect(html).toMatch(
      /Custom service[\s\S]*Tool 1[\s\S]*Tool 2[\s\S]*Tool 3/,
    );
    expect(html.match(/class="branch"/g)).toHaveLength(3);
    expect(html.match(/class="connector"/g)).toBeNull();
  });

  it('accepts equivalent service copy and escapes authored text', async () => {
    const html = await container.renderToString(WorkflowIllustration, {
      props: {
        variant: 'before-after',
        description: processAutomationDescription,
      },
    });
    expect(html).toContain(processAutomationDescription);
    expect(html).not.toContain(
      workflowIllustrations['before-after'].description,
    );
    const escaped = await container.renderToString(WorkflowIllustration, {
      props: { variant: 'branching', description: '<script>unsafe</script>' },
    });
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).not.toContain('<script>');
  });
});
