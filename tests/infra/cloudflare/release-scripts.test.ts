import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const script = (name: string) => join(root, 'infra/cloudflare', name);
const SHA = 'a'.repeat(40);
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'release-scripts-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function executable(path: string, body: string) {
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(path, 0o755);
}

function run(
  file: string,
  args: string[],
  env: Record<string, string> = {},
  path = process.env.PATH ?? '',
) {
  return spawnSync('bash', [script(file), ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: path, ...env },
  });
}

/** A fake `gh` driven by files in `dir`; no network or credentials. */
function fakeGh(opts: {
  stagingRun?: string;
  evidence?: string;
  record?: string;
}) {
  const bin = join(dir, 'gh');
  if (opts.evidence !== undefined)
    writeFileSync(join(dir, 'evidence.env'), opts.evidence);
  if (opts.record !== undefined)
    writeFileSync(join(dir, 'record.txt'), opts.record);
  executable(
    bin,
    `case "$1 $2" in
  "run list") echo "${opts.stagingRun ?? ''}" | sed '/^$/d' ;;
  "run download")
    [ -f "${dir}/evidence.env" ] || exit 1
    while [ $# -gt 0 ]; do [ "$1" = "--dir" ] && d="$2"; shift; done
    cp "${dir}/evidence.env" "$d/evidence.env" ;;
  "release download") [ -f "${dir}/record.txt" ] && cat "${dir}/record.txt" || exit 1 ;;
  *) exit 2 ;;
esac`,
  );
  return { GH_BIN: bin, GITHUB_REPOSITORY: 'o/r' };
}

const sums = 'f'.repeat(64);

describe('find-artifact-run.sh (staging evidence)', () => {
  it('returns the CI run and checksum when staging succeeded', () => {
    const env = fakeGh({
      stagingRun: '99',
      evidence: `ci_run_id=1234\nsums_sha256=${sums}\n`,
    });
    const r = run('find-artifact-run.sh', [SHA], env);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(`1234 ${sums}`);
  });

  it('fails closed when staging has no successful run', () => {
    const r = run('find-artifact-run.sh', [SHA], fakeGh({}));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('No successful staging deployment');
  });

  it('fails closed when the staging evidence artifact is absent', () => {
    const r = run('find-artifact-run.sh', [SHA], fakeGh({ stagingRun: '99' }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('no staging-evidence');
  });

  it('fails closed on malformed evidence and on a bad SHA', () => {
    const bad = fakeGh({ stagingRun: '99', evidence: 'ci_run_id=abc\n' });
    expect(run('find-artifact-run.sh', [SHA], bad).status).toBe(1);
    expect(run('find-artifact-run.sh', ['main'], bad).status).toBe(1);
  });
});

describe('find-release-record.sh (rollback)', () => {
  const record = (tag = 'v1.2.3') =>
    `tag=${tag}\nsha=${SHA}\nci_run_id=77\nsums_sha256=${sums}\n`;

  it('returns the originally released run, checksum and SHA', () => {
    const r = run(
      'find-release-record.sh',
      ['v1.2.3'],
      fakeGh({ record: record() }),
    );
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(`77 ${sums} ${SHA}`);
  });

  it('fails closed without a record, with a mismatched tag or a bad tag', () => {
    expect(run('find-release-record.sh', ['v1.2.3'], fakeGh({})).status).toBe(
      1,
    );
    expect(
      run(
        'find-release-record.sh',
        ['v1.2.3'],
        fakeGh({ record: record('v9.9.9') }),
      ).status,
    ).toBe(1);
    expect(
      run(
        'find-release-record.sh',
        ['v1.2.3-rc.1'],
        fakeGh({ record: record() }),
      ).status,
    ).toBe(1);
  });
});

describe('prepare-production.sh', () => {
  function artifact(
    files: Record<string, string> = {
      'index.html': '<h1>x</h1>',
      'robots.txt': 'User-agent: *\nAllow: /\n',
    },
  ) {
    const src = join(dir, 'artifact');
    mkdirSync(src);
    for (const [name, body] of Object.entries(files))
      writeFileSync(join(src, name), body);
    const list =
      Object.entries(files)
        .map(([n, b]) => `${sha256(b)}  ${n}`)
        .join('\n') + '\n';
    writeFileSync(join(src, 'SHA256SUMS'), list);
    return { src, id: sha256(list) };
  }

  it('keeps robots.txt, writes indexable production headers and drops SHA256SUMS', () => {
    const { src, id } = artifact();
    const out = join(dir, 'out');
    const r = run('prepare-production.sh', [src, out, id]);
    expect(r.status).toBe(0);
    expect(readFileSync(join(out, 'robots.txt'), 'utf8')).toContain('Allow: /');
    const headers = readFileSync(join(out, '_headers'), 'utf8');
    expect(headers).toContain('Strict-Transport-Security');
    expect(headers.toLowerCase()).not.toContain('noindex');
    expect(existsSync(join(out, 'SHA256SUMS'))).toBe(false);
  });

  it('rejects an artifact whose identity differs from the recorded one', () => {
    const { src } = artifact();
    const r = run('prepare-production.sh', [src, join(dir, 'out'), sums]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('identity differs');
  });

  it('rejects a tampered file (checksum mismatch) and non-regular files', () => {
    const { src, id } = artifact();
    writeFileSync(join(src, 'index.html'), 'tampered');
    expect(
      run('prepare-production.sh', [src, join(dir, 'o1'), id]).status,
    ).not.toBe(0);
    symlinkSync('/etc/passwd', join(src, 'link'));
    const r = run('prepare-production.sh', [src, join(dir, 'o2'), id]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('non-regular');
  });

  it('refuses to overwrite an existing output directory', () => {
    const { src, id } = artifact();
    mkdirSync(join(dir, 'out'));
    expect(
      run('prepare-production.sh', [src, join(dir, 'out'), id]).status,
    ).toBe(1);
  });
});

describe('smoke-production.sh', () => {
  /** fake curl returning the given headers; fake sleep so retries are instant */
  function fakes(headers: string, failHealth = false) {
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    writeFileSync(join(dir, 'headers.txt'), headers);
    executable(join(bin, 'sleep'), 'exit 0');
    executable(
      join(bin, 'curl'),
      `while [ $# -gt 0 ]; do case "$1" in -D) h="$2";; esac; shift; done
if [ -n "$h" ]; then cat '${join(dir, 'headers.txt')}' > "$h"; exit 0; fi
${failHealth ? 'exit 22' : 'exit 0'}`,
    );
    return `${bin}:${process.env.PATH}`;
  }
  const good =
    "Content-Security-Policy: default-src 'self'; frame-ancestors 'none'\r\nStrict-Transport-Security: max-age=31536000\r\nX-Content-Type-Options: nosniff\r\n";

  it('passes with security headers, indexable, and healthy Worker', () => {
    const r = run(
      'smoke-production.sh',
      ['https://x.test/', 'https://w.test/health'],
      {},
      fakes(good),
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('OK: https://w.test/health');
  });

  it('fails when noindex is present', () => {
    const r = run(
      'smoke-production.sh',
      ['https://x.test/'],
      {},
      fakes(`${good}X-Robots-Tag: noindex\r\n`),
    );
    expect(r.status).toBe(1);
  });

  it('fails when a security header is missing', () => {
    const r = run(
      'smoke-production.sh',
      ['https://x.test/'],
      {},
      fakes('X-Content-Type-Options: nosniff\r\n'),
    );
    expect(r.status).toBe(1);
  });

  it('fails when the Worker health check fails', () => {
    const r = run(
      'smoke-production.sh',
      ['https://x.test/', 'https://w.test/health'],
      {},
      fakes(good, true),
    );
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toContain('Worker health check failed');
  });
});
