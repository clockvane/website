// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const page = `
  <details data-disc><summary>Menu</summary><a href="/">Home</a></details>
  <button data-pause data-pause-label="Pause examples" data-resume-label="Resume examples" hidden>Pause examples</button>
  <div data-marquee><div class="track"><div class="group"><img alt="Example" src="a.png" /></div></div></div>
  <div role="tablist" data-tabs hidden>
    <button role="tab" id="t1" aria-controls="p1"></button>
    <button role="tab" id="t2" aria-controls="p2"></button>
  </div>
  <section id="p1"></section><section id="p2"></section>
  <section data-demo data-finished="Finished." data-control-name="AI reply example">
    <div data-demo-controls hidden>
      <button data-demo-toggle></button><button data-demo-replay></button>
    </div>
    <p data-demo-status></p>
    <div data-demo-stage>
      <p data-demo-prompt>Prompt text</p>
      <ol><li class="is-done" data-step></li><li class="is-done" data-step></li></ol>
      <div data-demo-result></div>
    </div>
  </section>`;

const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector) as T;

async function load(reduced: boolean) {
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-paused');
  document.body.innerHTML = page;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('reduced-motion'),
      addEventListener: vi.fn(),
    })),
  );
  const observed: Array<(entries: unknown[]) => void> = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: unknown[]) => void) {
        observed.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.resetModules();
  await import('../../../src/scripts/motion');
  return observed;
}

describe('motion controller', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('leaves the stopped, finished page alone under reduced motion', async () => {
    await load(true);
    expect(document.documentElement.classList.contains('js-motion')).toBe(
      false,
    );
    expect(document.querySelectorAll('.group')).toHaveLength(1);
    expect($('[data-pause]').hidden).toBe(true);
    expect($('[data-demo-controls]').hidden).toBe(true);
    expect(document.querySelectorAll('.is-done')).toHaveLength(2);
    expect($('[data-demo-prompt]').textContent).toBe('Prompt text');
  });

  it('adds aria-hidden loop copies with empty alt when motion is allowed', async () => {
    await load(false);
    expect(document.documentElement.classList.contains('js-motion')).toBe(true);
    const copy = $('[data-loop-copy]');
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(
      document
        .querySelector('.group:not([data-loop-copy]) img')
        ?.getAttribute('alt'),
    ).toBe('Example');
  });

  it('shares one sticky pause state and relabels the button', async () => {
    await load(false);
    const button = $('[data-pause]');
    expect(button.hidden).toBe(false);
    button.click();
    expect(document.documentElement.hasAttribute('data-paused')).toBe(true);
    expect(button.textContent).toBe('Resume examples');
    button.click();
    expect(button.textContent).toBe('Pause examples');
  });

  it('tabs: roving tabindex, arrow keys, roles only with script', async () => {
    await load(true);
    const [first, second] = [$('#t1'), $('#t2')];
    expect($('[data-tabs]').hidden).toBe(false);
    expect($('#p1').getAttribute('role')).toBe('tabpanel');
    expect($('#p2').hidden).toBe(true);
    first.focus();
    $('[data-tabs]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(second.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
    expect($('#p1').hidden).toBe(true);
    expect($('#p2').hidden).toBe(false);
  });

  it('demo: starts in view, pauses, finishes, keeps all text and moves focus off the hidden toggle', async () => {
    const [seen] = await load(false);
    const demo = $('[data-demo]');
    const toggle = $('[data-demo-toggle]');
    expect(demo.dataset.state).toBe('ready');
    expect($('[data-demo-prompt]').textContent).toBe('Prompt text');
    seen?.([{ target: $('[data-demo-stage]'), isIntersecting: true }]);
    expect(demo.dataset.state).toBe('running');
    expect(toggle.textContent).toBe('Pause example');
    toggle.click();
    expect(demo.dataset.state).toBe('paused');
    expect(toggle.getAttribute('aria-label')).toBe(
      'Play example: AI reply example',
    );
    toggle.click();
    toggle.focus();
    vi.setSystemTime(Date.now() + 6000);
    await vi.advanceTimersByTimeAsync(6000);
    expect(demo.dataset.state).toBe('done');
    expect(toggle.hidden).toBe(true);
    expect(document.activeElement).toBe($('[data-demo-replay]'));
    expect($('[data-demo-status]').textContent).toBe('Finished.');
    expect($('[data-demo-prompt]').textContent).toBe('Prompt text');
  });

  it('disclosures close on Escape, returning focus, and on an outside click', async () => {
    await load(true);
    const disc = $<HTMLDetailsElement>('[data-disc]');
    disc.open = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(disc.open).toBe(false);
    expect(document.activeElement).toBe($('summary'));
    disc.open = true;
    document.body.click();
    expect(disc.open).toBe(false);
  });
});
