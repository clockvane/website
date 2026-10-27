import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Lints in-memory Astro sources through eslint.config.js (resolved from the repo root, where Vitest runs).
// The file path is virtual; it only selects which config blocks apply.
const eslint = new ESLint();
const filePath = 'src/components/A11yLintFixture.astro';

async function lintAstro(source: string) {
  const [result] = await eslint.lintText(source, { filePath });
  return result?.messages ?? [];
}

describe('eslint.config.js accessibility rules for .astro files', () => {
  it('reports an image without an alt attribute', async () => {
    const messages = await lintAstro(
      '<img src="/logo.svg" width="10" height="10" />\n',
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'astro/jsx-a11y/alt-text',
          severity: 2,
        }),
      ]),
    );
  });

  it('passes accessible markup', async () => {
    const messages = await lintAstro(
      '<img src="/logo.svg" alt="Company logo" width="10" height="10" />\n',
    );

    expect(messages).toEqual([]);
  });
});
