import { describe, expect, it } from 'vitest';
import {
  parseSubject,
  prepend,
  renderSection,
} from '../../../infra/release/changelog';

describe('changelog', () => {
  it('parses Conventional Commit titles and takes the last PR number', () => {
    expect(
      parseSubject('feat(content): About page (#137) (#141)'),
    ).toMatchObject({
      type: 'feat',
      scope: 'content',
      text: 'About page',
      ref: '141',
    });
    expect(parseSubject('not conventional')).toBeNull();
  });

  it('maps feat/fix/perf, hides chore/docs/ci and shows breaking changes', () => {
    const md = renderSection('1.1.0', '2026-11-08', [
      'feat(nav): add menu (#1)',
      'fix: broken link (#2)',
      'perf: smaller fonts (#3)',
      'docs: typo (#4)',
      'ci: tweak (#5)',
      'refactor!: new URL scheme (#6)',
    ]);
    expect(md).toContain('## [1.1.0] - 2026-11-08');
    expect(md).toContain('### Added\n- **nav:** add menu (#1)');
    expect(md).toContain('### Fixed\n- broken link (#2)');
    expect(md).toContain('### Changed\n- smaller fonts (#3)');
    expect(md).toContain('### Breaking changes\n- new URL scheme (#6)');
    expect(md).not.toContain('typo');
    expect(md).not.toContain('tweak');
  });

  it('says so when only hidden types were merged', () => {
    expect(
      renderSection('1.0.1', '2026-11-09', ['chore: deps (#7)']),
    ).toContain('Maintenance only');
  });

  it('prepends new sections under the header, newest first', () => {
    const first = prepend(
      '',
      renderSection('1.0.0', '2026-11-01', ['feat: a (#1)']),
    );
    const second = prepend(
      first,
      renderSection('1.1.0', '2026-11-08', ['fix: b (#2)']),
    );
    expect(second.startsWith('# Changelog')).toBe(true);
    expect(second.indexOf('[1.1.0]')).toBeLessThan(second.indexOf('[1.0.0]'));
    expect(second.match(/# Changelog/g)).toHaveLength(1);
  });
});
