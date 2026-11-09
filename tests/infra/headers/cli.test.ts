import { execFileSync } from 'node:child_process';
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
import { afterAll, describe, expect, it } from 'vitest';
import { siteConfig } from '../../../site.config';

const root = resolve(__dirname, '../../..');
const cli = join(root, 'infra/headers/cli.ts');
const adapter = join(root, 'infra/cloudflare/prepare-preview.sh');
const configOrigin = new URL(siteConfig.contact.endpoint).origin;
const override = 'https://override.example.workers.dev';

function env(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const e = { ...process.env, ...extra };
  delete e['ENQUIRY_WORKER_ORIGIN'];
  delete e['PREPARE_ENQUIRY_FROM_CONFIG'];
  return { ...e, ...extra };
}

function run(args: string[], extra: Record<string, string> = {}): string {
  return execFileSync('node', [cli, ...args], {
    env: env(extra),
    encoding: 'utf8',
  });
}

const line = (out: string, name: string): string =>
  out.split('\n').find((l) => l.includes(name)) ?? '';

describe('headers CLI', () => {
  it('defaults to self-only CSP without noindex', () => {
    const out = run([]);
    expect(out).not.toContain('X-Robots-Tag');
    expect(line(out, 'Content-Security-Policy')).toContain(
      "connect-src 'self';",
    );
    expect(out).not.toContain(configOrigin);
  });

  it('--noindex adds X-Robots-Tag', () => {
    expect(run(['--noindex'])).toContain('X-Robots-Tag: noindex');
  });

  it('--enquiry-from-config puts the config origin in connect-src and form-action', () => {
    const csp = line(run(['--enquiry-from-config']), 'Content-Security-Policy');
    expect(csp).toContain(`connect-src 'self' ${configOrigin}`);
    expect(csp).toContain(`form-action 'self' ${configOrigin}`);
  });

  it('ENQUIRY_WORKER_ORIGIN wins over the config', () => {
    const csp = line(
      run(['--enquiry-from-config'], { ENQUIRY_WORKER_ORIGIN: override }),
      'Content-Security-Policy',
    );
    expect(csp).toContain(`connect-src 'self' ${override}`);
    expect(csp).toContain(`form-action 'self' ${override}`);
    expect(csp).not.toContain(configOrigin);
  });
});

describe('prepare-preview.sh', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'prep-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  const art = join(tmp, 'artifact');
  mkdirSync(art);
  const html = '<!doctype html><title>x</title>';
  writeFileSync(join(art, 'index.html'), html);
  const sum = createHash('sha256').update(html).digest('hex');
  writeFileSync(join(art, 'SHA256SUMS'), `${sum}  index.html\n`);

  function prepare(name: string, extra: Record<string, string>): string {
    const out = join(tmp, name);
    execFileSync('bash', [adapter, art, out], {
      env: env(extra),
      stdio: 'pipe',
    });
    return out;
  }

  it('forwards PREPARE_ENQUIRY_FROM_CONFIG and keeps the input artifact intact', () => {
    const out = prepare('with-config', { PREPARE_ENQUIRY_FROM_CONFIG: '1' });
    const headers = readFileSync(join(out, '_headers'), 'utf8');
    expect(headers).toContain('X-Robots-Tag: noindex');
    expect(headers).toContain(`connect-src 'self' ${configOrigin}`);
    expect(readFileSync(join(out, 'robots.txt'), 'utf8')).toContain(
      'Disallow: /',
    );
    expect(readFileSync(join(art, 'SHA256SUMS'), 'utf8')).toContain(sum);
    expect(() => readFileSync(join(art, '_headers'))).toThrow();
    expect(() => readFileSync(join(out, 'SHA256SUMS'))).toThrow();
  });

  it('without the flag stays self-only', () => {
    const headers = readFileSync(
      join(prepare('plain', {}), '_headers'),
      'utf8',
    );
    expect(headers).not.toContain(configOrigin);
    expect(headers).toContain('X-Robots-Tag: noindex');
  });
});
