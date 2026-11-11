import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const script = (name: string) => join(root, 'infra/cloudflare', name);
const BAKED = 'https://example.invalid';
const STAGING = 'https://enquiry-staging.acme.workers.dev';
const PROD = 'https://enquiry.acme.workers.dev';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const html = `<html><body><form action="${BAKED}/enquiry" method="post"></form></body></html>`;
const js = `fetch("${BAKED}/enquiry",{method:"POST"})`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'enquiry-origin-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** A built artifact with a valid SHA256SUMS; returns paths and the checksum identity. */
function artifact() {
  const src = join(dir, 'src');
  mkdirSync(join(src, 'contact'), { recursive: true });
  mkdirSync(join(src, '_astro'));
  writeFileSync(join(src, 'contact/index.html'), html);
  writeFileSync(join(src, '_astro/form.js'), js);
  const sums = `${sha256(html)}  contact/index.html\n${sha256(js)}  _astro/form.js\n`;
  writeFileSync(join(src, 'SHA256SUMS'), sums);
  return { src, id: sha256(sums) };
}

function sh(file: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync('bash', [script(file), ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

describe('set-enquiry-origin.sh', () => {
  it('rewrites the form action and the script endpoint', () => {
    const { src } = artifact();
    const r = sh('set-enquiry-origin.sh', [src, `${STAGING}/`]);
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(src, 'contact/index.html'), 'utf8')).toContain(
      `action="${STAGING}/enquiry"`,
    );
    expect(readFileSync(join(src, '_astro/form.js'), 'utf8')).toContain(
      `${STAGING}/enquiry`,
    );
  });

  it('does nothing without an origin', () => {
    const { src } = artifact();
    expect(sh('set-enquiry-origin.sh', [src]).status).toBe(0);
    expect(readFileSync(join(src, 'contact/index.html'), 'utf8')).toBe(html);
  });

  it('rejects an origin that is not a bare https origin', () => {
    const { src } = artifact();
    for (const bad of ['http://a.dev', `${STAGING}/x`, 'https://a.dev#;rm']) {
      expect(sh('set-enquiry-origin.sh', [src, bad]).status).not.toBe(0);
    }
  });
});

describe('per-environment endpoint, one artifact', () => {
  it('staging and production point at their own Worker; the artifact stays identical', () => {
    const { src, id } = artifact();
    const before = readFileSync(join(src, 'SHA256SUMS'), 'utf8');

    const stg = sh('prepare-preview.sh', [src, join(dir, 'stg')], {
      ENQUIRY_WORKER_ORIGIN: STAGING,
    });
    expect(stg.status, stg.stderr).toBe(0);
    const prod = sh('prepare-production.sh', [src, join(dir, 'prod'), id], {
      ENQUIRY_WORKER_ORIGIN: PROD,
    });
    expect(prod.status, prod.stderr).toBe(0);

    const form = (d: string) =>
      readFileSync(join(dir, d, 'contact/index.html'), 'utf8');
    expect(form('stg')).toContain(`action="${STAGING}/enquiry"`);
    expect(form('prod')).toContain(`action="${PROD}/enquiry"`);
    expect(readFileSync(join(dir, 'stg/_headers'), 'utf8')).toContain(STAGING);
    expect(readFileSync(join(dir, 'prod/_headers'), 'utf8')).toContain(PROD);

    // The CI artifact and its checksum identity are untouched.
    expect(readFileSync(join(src, 'SHA256SUMS'), 'utf8')).toBe(before);
    expect(readFileSync(join(src, 'contact/index.html'), 'utf8')).toBe(html);
    expect(sha256(before)).toBe(id);
  });
});
