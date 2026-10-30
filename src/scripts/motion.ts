/**
 * The single motion controller (ADR-004). It owns motion policy, one shared
 * IntersectionObserver, pausing, replay and Escape. Scenes are plain HTML/CSS:
 * `<section data-scene data-duration="1800">` with an optional `[data-replay]`
 * button. CSS shows the finished state first. Scope keyframes only to
 * `.js-motion [data-scene][data-state='playing']` and
 * `.js-motion [data-scene][data-state='paused']`, never `done`, so pause keeps
 * progress and completion removes the animation for replay. No-JS readers
 * keep the finished state.
 */
import {
  Playback,
  VISIBLE_RATIO,
  motionAllowed,
  sceneDuration,
} from '../lib/motion/policy';

type State = 'playing' | 'paused' | 'done';

interface Scene {
  el: HTMLElement;
  playback: Playback;
  timer: number;
  visible: boolean;
}

const root = document.documentElement;
const scenes = new Map<Element, Scene>();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const lowData = matchMedia('(prefers-reduced-data: reduce)');
const saveData = () =>
  Boolean(
    (navigator as { connection?: { saveData?: boolean } }).connection?.saveData,
  );
const allowed = () =>
  motionAllowed({
    reducedMotion: reduced.matches,
    reducedData: lowData.matches,
    saveData: saveData(),
  });

const replayOf = (s: Scene) => s.el.querySelector<HTMLElement>('[data-replay]');

function setState(s: Scene, state: State): void {
  s.el.dataset.state = state;
  const replay = replayOf(s);
  if (replay) replay.setAttribute('aria-disabled', String(state !== 'done'));
}

function finish(s: Scene): void {
  clearTimeout(s.timer);
  s.playback.pause(performance.now());
  setState(s, 'done');
}

function run(s: Scene): void {
  s.playback.resume(performance.now());
  clearTimeout(s.timer);
  s.timer = window.setTimeout(() => finish(s), s.playback.remaining);
  setState(s, 'playing');
}

function pause(s: Scene): void {
  if (!s.playback.running) return;
  clearTimeout(s.timer);
  s.playback.pause(performance.now());
  setState(s, 'paused');
}

/** Play when ≥35% visible in a visible tab; otherwise pause where it stopped. */
function sync(s: Scene): void {
  if (s.el.dataset.state === 'done' || !allowed()) return;
  if (s.visible && !document.hidden) run(s);
  else pause(s);
}

function restart(s: Scene): void {
  s.playback = new Playback(sceneDuration(s.el.dataset.duration));
  sync(s);
}

function stopAll(): void {
  for (const s of scenes.values()) finish(s);
}

function apply(): void {
  const on = allowed();
  root.classList.toggle('js-motion', on);
  for (const s of scenes.values()) {
    const replay = replayOf(s);
    if (replay) replay.hidden = !on;
  }
  if (!on) stopAll();
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const s = scenes.get(entry.target);
      if (!s) continue;
      s.visible = entry.intersectionRatio >= VISIBLE_RATIO;
      sync(s);
    }
  },
  { threshold: [0, VISIBLE_RATIO] },
);

for (const el of document.querySelectorAll<HTMLElement>('[data-scene]')) {
  const s: Scene = {
    el,
    playback: new Playback(sceneDuration(el.dataset.duration)),
    timer: 0,
    visible: false,
  };
  scenes.set(el, s);
  observer.observe(el);
  replayOf(s)?.addEventListener('click', (e) => {
    // aria-disabled keeps focus on the control while a run is active.
    if (s.el.dataset.state === 'done' && allowed()) restart(s);
    else e.preventDefault();
  });
  // Escape is scoped to a scene with focus inside it, never global.
  el.addEventListener('keydown', (e) => {
    const state = el.dataset.state;
    if (e.key === 'Escape' && (state === 'playing' || state === 'paused')) {
      finish(s);
    }
  });
}

reduced.addEventListener('change', apply);
lowData.addEventListener('change', apply);
document.addEventListener('visibilitychange', () => {
  for (const s of scenes.values()) sync(s);
});
apply();
