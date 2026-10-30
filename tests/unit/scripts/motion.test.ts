// @vitest-environment happy-dom
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

describe('motion controller DOM lifecycle', () => {
  let scene: HTMLElement;
  let replay: HTMLButtonElement;
  let intersect: (ratio: number) => void;
  const observe = vi.fn();
  let visibility: MockInstance<() => boolean>;
  let listeners: MockInstance<Document['addEventListener']>;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    observe.mockClear();
    document.documentElement.className = '';
    document.body.innerHTML = `
      <section data-scene data-duration="1800">
        <button type="button" data-replay hidden>Replay</button>
      </section>`;
    scene = document.querySelector<HTMLElement>('[data-scene]')!;
    replay = document.querySelector<HTMLButtonElement>('[data-replay]')!;
    visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    listeners = vi.spyOn(document, 'addEventListener');
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(
          callback: (
            entries: Pick<
              IntersectionObserverEntry,
              'target' | 'intersectionRatio'
            >[],
          ) => void,
        ) {
          intersect = (ratio) =>
            callback([{ target: scene, intersectionRatio: ratio }]);
        }

        observe = observe;
      },
    );
    await import('../../../src/scripts/motion');
  });

  afterEach(() => {
    // Module imports register document listeners; remove them between fixtures.
    for (const [type, listener, options] of listeners.mock.calls) {
      document.removeEventListener(type, listener, options);
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.documentElement.className = '';
  });

  it('plays, completes and replays for the full duration', () => {
    expect(observe).toHaveBeenCalledExactlyOnceWith(scene);
    expect(document.documentElement.classList.contains('js-motion')).toBe(true);
    expect(replay.hidden).toBe(false);
    intersect(1);
    expect(scene.dataset.state).toBe('playing');
    expect(replay.getAttribute('aria-disabled')).toBe('true');
    vi.advanceTimersByTime(1800);
    expect(scene.dataset.state).toBe('done');
    expect(replay.getAttribute('aria-disabled')).toBe('false');

    replay.focus();
    replay.click();
    expect(scene.dataset.state).toBe('playing');
    expect(replay.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(replay);
    vi.advanceTimersByTime(1799);
    expect(scene.dataset.state).toBe('playing');
    vi.advanceTimersByTime(1);
    expect(scene.dataset.state).toBe('done');
    expect(replay.getAttribute('aria-disabled')).toBe('false');
  });

  it('pauses in a hidden tab and resumes from the remaining duration', () => {
    intersect(1);
    vi.advanceTimersByTime(600);
    visibility.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(scene.dataset.state).toBe('paused');
    vi.advanceTimersByTime(5000);
    expect(scene.dataset.state).toBe('paused');

    visibility.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(scene.dataset.state).toBe('playing');
    vi.advanceTimersByTime(1199);
    expect(scene.dataset.state).toBe('playing');
    vi.advanceTimersByTime(1);
    expect(scene.dataset.state).toBe('done');
  });

  it.each(['playing', 'paused'])(
    'Escape finishes a %s scene without moving focus',
    (state) => {
      intersect(1);
      replay.focus();
      if (state === 'paused') intersect(0);
      expect(scene.dataset.state).toBe(state);
      replay.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      expect(scene.dataset.state).toBe('done');
      expect(replay.getAttribute('aria-disabled')).toBe('false');
      expect(document.activeElement).toBe(replay);
      vi.advanceTimersByTime(1800);
      expect(scene.dataset.state).toBe('done');
    },
  );

  it('keeps an already-painted in-view scene finished without resetting its frame', async () => {
    vi.spyOn(scene, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      bottom: 210,
      height: 200,
    } as DOMRect);
    vi.resetModules();
    await import('../../../src/scripts/motion');
    expect(scene.dataset.state).toBe('done');
    intersect(1);
    expect(scene.dataset.state).toBe('done');
  });

  it('leaves the static frame and hides replay when observers are unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    vi.resetModules();
    await import('../../../src/scripts/motion');
    expect(scene.dataset.state).toBe('done');
    expect(replay.hidden).toBe(true);
    expect(document.documentElement.classList.contains('js-motion')).toBe(
      false,
    );
  });

  it('observes the illustration when replay lives in a larger service row', async () => {
    const visual = document.createElement('figure');
    visual.dataset.sceneVisual = '';
    scene.append(visual);
    vi.resetModules();
    await import('../../../src/scripts/motion');
    expect(observe).toHaveBeenLastCalledWith(visual);
  });

  it('immediately settles scenes when Save-Data changes', async () => {
    const connection = Object.assign(new EventTarget(), { saveData: false });
    vi.stubGlobal('navigator', { connection });
    vi.resetModules();
    await import('../../../src/scripts/motion');
    intersect(1);
    expect(scene.dataset.state).toBe('playing');
    connection.saveData = true;
    connection.dispatchEvent(new Event('change'));
    expect(scene.dataset.state).toBe('done');
    expect(replay.hidden).toBe(true);
    expect(document.documentElement.classList.contains('js-motion')).toBe(
      false,
    );
  });
});
