import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) =>
  readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const toml = read('infra/cloudflare/enquiry-worker/wrangler.toml');

describe('enquiry Worker environments', () => {
  it('names a separate staging and production Worker', () => {
    expect(toml).toMatch(/\[env\.staging\]\s+name = "enquiry-staging"/);
    expect(toml).toMatch(/\[env\.production\]\s+name = "enquiry"/);
  });

  it('gives each environment its own rate limit namespace', () => {
    const ids = [...toml.matchAll(/namespace_id = "(\d+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('deploys staging from main and production only from the release workflow', () => {
    expect(read('.github/workflows/deploy-worker.yml')).toContain(
      '--env staging',
    );
    expect(read('.github/workflows/deploy-worker.yml')).not.toContain(
      '--env production',
    );
    expect(read('.github/workflows/release.yml')).toContain('--env production');
  });
});
