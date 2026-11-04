/**
 * The single motion controller (ADR-004): disclosures, tabs, marquees, reveals and the AI demo. The
 * HTML is the complete, stopped page; this adds behaviour on top. CSS does all the animating, and
 * hidden-until-revealed states exist only under `.js-motion`, which is set only when motion is allowed.
 */
import {
  DEMO_STEP_MS,
  demoEnd,
  demoFrame,
  motionAllowed,
  tabTarget,
} from '../lib/motion/policy';

const root = document.documentElement;
const all = <T extends Element>(
  selector: string,
  scope: ParentNode = document,
) => [...scope.querySelectorAll<T>(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const lowData = matchMedia('(prefers-reduced-data: reduce)');
const connection = (
  navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }
).connection;
const allowed = () =>
  typeof IntersectionObserver !== 'undefined' &&
  motionAllowed({
    reducedMotion: reduced.matches,
    reducedData: lowData.matches,
    saveData: connection?.saveData === true,
  });

/** Disclosures close on Escape and on a click elsewhere, and work without this too. */
function initDisclosures(): void {
  const discs = all<HTMLDetailsElement>('[data-disc]');
  document.addEventListener('click', (event) => {
    const inside = (event.target as Element).closest('[data-disc]');
    for (const disc of discs) if (disc !== inside) disc.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = discs.find((disc) => disc.open);
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  });
}

/** All panels stack without script; this turns them into one tablist with roving tabindex. */
function initTabs(): void {
  for (const list of all<HTMLElement>('[data-tabs]')) {
    const tabs = all<HTMLElement>('[role="tab"]', list);
    const panels = tabs.map((tab) =>
      document.getElementById(tab.getAttribute('aria-controls') ?? ''),
    );
    const select = (index: number, focus = false) => {
      tabs.forEach((tab, n) => {
        tab.setAttribute('aria-selected', String(n === index));
        tab.tabIndex = n === index ? 0 : -1;
        const panel = panels[n];
        if (panel) panel.hidden = n !== index;
      });
      if (focus) tabs[index]?.focus();
    };
    panels.forEach((panel, n) => {
      panel?.setAttribute('role', 'tabpanel');
      panel?.setAttribute('aria-labelledby', tabs[n]?.id ?? '');
    });
    list.hidden = false;
    select(0);
    tabs.forEach((tab, n) => tab.addEventListener('click', () => select(n)));
    list.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(document.activeElement as HTMLElement);
      const target = tabTarget(event.key, index, tabs.length);
      if (target === undefined) return;
      event.preventDefault();
      select(target, true);
    });
  }
}

/** Replays the finished script in the HTML. Returns its controls, or nothing if it is absent. */
function initDemo() {
  const demo = document.querySelector<HTMLElement>('[data-demo]');
  const prompt = demo?.querySelector<HTMLElement>('[data-demo-prompt]');
  const result = demo?.querySelector<HTMLElement>('[data-demo-result]');
  const controls = demo?.querySelector<HTMLElement>('[data-demo-controls]');
  const toggle = demo?.querySelector<HTMLElement>('[data-demo-toggle]');
  const replay = demo?.querySelector<HTMLElement>('[data-demo-replay]');
  const status = demo?.querySelector<HTMLElement>('[data-demo-status]');
  if (!demo || !prompt || !result || !controls || !toggle || !replay || !status)
    return undefined;

  const steps = all<HTMLElement>('[data-step]', demo);
  const text = prompt.textContent ?? '';
  const end = demoEnd(steps.length);
  // Elements for typing are made once; the untyped part stays in the DOM for assistive technology.
  const typed = document.createElement('span');
  const caret = document.createElement('span');
  const rest = document.createElement('span');
  caret.className = 'is-caret';
  caret.setAttribute('aria-hidden', 'true');
  rest.className = 'is-typing-rest';

  let elapsed = end;
  let timer = 0;
  let last = 0;
  let visible = true;

  const label = (name: string) => {
    toggle.textContent = `${name} example`;
    toggle.setAttribute(
      'aria-label',
      `${name} example: ${demo.dataset.controlName}`,
    );
  };
  const draw = () => {
    const frame = demoFrame(elapsed, text.length, steps.length);
    typed.textContent = text.slice(0, frame.typed);
    rest.textContent = text.slice(frame.typed);
    caret.hidden = frame.typed === text.length;
    steps.forEach((step, n) => {
      step.classList.toggle('is-active', n === frame.active);
      step.classList.toggle('is-done', n < frame.done);
    });
    result.classList.toggle('is-waiting', !frame.resultShown);
  };
  const halt = () => {
    clearInterval(timer);
    timer = 0;
  };
  const finish = () => {
    halt();
    elapsed = end;
    draw();
    demo.dataset.state = 'done';
    // Hiding a focused control would drop focus to the page.
    if (document.activeElement === toggle) replay.focus();
    toggle.hidden = true;
    status.textContent = demo.dataset.finished ?? '';
  };
  const tick = () => {
    const now = performance.now();
    elapsed += now - last;
    last = now;
    if (elapsed >= end) finish();
    else draw();
  };
  /** Runs only while wanted, on-screen and in a visible tab; each pause keeps its place. */
  const sync = () => {
    halt();
    if (demo.dataset.state !== 'running' || !visible || document.hidden) return;
    last = performance.now();
    timer = window.setInterval(tick, DEMO_STEP_MS / 20);
  };
  const run = () => {
    demo.dataset.state = 'running';
    label('Pause');
    toggle.hidden = false;
    status.textContent = '';
    sync();
  };
  const pause = () => {
    demo.dataset.state = 'paused';
    label('Play');
    sync();
  };
  const start = () => {
    elapsed = 0;
    draw();
    run();
  };

  toggle.addEventListener('click', () =>
    demo.dataset.state === 'running' ? pause() : run(),
  );
  replay.addEventListener('click', start);
  demo.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && demo.dataset.state === 'running') pause();
  });

  return {
    stage: demo.querySelector<HTMLElement>('[data-demo-stage]'),
    start,
    setVisible(next: boolean) {
      visible = next;
      sync();
    },
    /** Sets up playback controls and the waiting state, before the stage scrolls into view. */
    enable() {
      prompt.replaceChildren(typed, caret, rest);
      controls.hidden = false;
      demo.dataset.state = 'ready';
      elapsed = 0;
      draw();
    },
    /** Back to the plain finished draft, for a visitor who turns motion off mid-run. */
    disable() {
      elapsed = end;
      halt();
      draw();
      prompt.textContent = text;
      controls.hidden = true;
      delete demo.dataset.state;
    },
    sync,
  };
}

const demo = initDemo();
const pauses = all<HTMLElement>('[data-pause]');
let observers: IntersectionObserver[] = [];

function pauseLabel(button: HTMLElement, paused: boolean): void {
  button.textContent =
    (paused ? button.dataset.resumeLabel : button.dataset.pauseLabel) ?? '';
}

function enableMotion(): void {
  root.classList.add('js-motion');
  // Loop copies: hidden from assistive technology, same image URLs, nothing focusable.
  for (const group of all('[data-marquee] .group')) {
    const copy = group.cloneNode(true) as Element;
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('data-loop-copy', '');
    for (const img of all<HTMLImageElement>('img', copy)) img.alt = '';
    group.after(copy);
  }
  for (const button of pauses) button.hidden = false;
  demo?.enable();

  // One observer per threshold set: one-shot reveals and the demo's start, then off-screen pausing.
  const seen = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add('is-in');
        seen.unobserve(target);
        if (target === demo?.stage) demo.start();
      }
    },
    { threshold: 0.12 },
  );
  for (const el of all('.reveal')) seen.observe(el);
  if (demo?.stage) seen.observe(demo.stage);
  const onScreen = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      target.toggleAttribute('data-offscreen', !isIntersecting);
      if (target === demo?.stage) demo.setVisible(isIntersecting);
    }
  });
  for (const el of all('[data-marquee]')) onScreen.observe(el);
  if (demo?.stage) onScreen.observe(demo.stage);
  observers = [seen, onScreen];
}

function disableMotion(): void {
  root.classList.remove('js-motion');
  for (const copy of all('[data-loop-copy]')) copy.remove();
  for (const button of pauses) button.hidden = true;
  for (const observer of observers) observer.disconnect();
  observers = [];
  demo?.disable();
}

function apply(): void {
  const on = allowed();
  if (on === root.classList.contains('js-motion')) return;
  if (on) enableMotion();
  else disableMotion();
}

// One pause state for the page; once paused it stays paused until pressed again (WCAG 2.2.2).
for (const button of pauses) {
  button.addEventListener('click', () => {
    const paused = root.toggleAttribute('data-paused');
    for (const each of pauses) pauseLabel(each, paused);
  });
}
document.addEventListener('visibilitychange', () => {
  root.toggleAttribute('data-hidden-tab', document.hidden);
  demo?.sync();
});
reduced.addEventListener('change', apply);
lowData.addEventListener('change', apply);
connection?.addEventListener('change', apply);

initDisclosures();
initTabs();
apply();
