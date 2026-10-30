/** Motion policy and playback timing (ADR-004 §3). Pure, so it is unit-tested. */

export interface MotionEnv {
  reducedMotion: boolean;
  reducedData: boolean;
  saveData: boolean;
}

/** No sequence, including its stagger, may exceed this (docs/design/motion.md). */
export const MAX_SCENE_MS = 2400;
export const DEFAULT_SCENE_MS = 1800;
/** A scene plays while at least this share of it is visible. */
export const VISIBLE_RATIO = 0.35;

/** Any of the three preferences turns every sequence off. */
export function motionAllowed(env: MotionEnv): boolean {
  return !env.reducedMotion && !env.reducedData && !env.saveData;
}

/** Parse a `data-duration` value in ms, clamped to the 2.4 s ceiling. */
export function sceneDuration(raw: string | null | undefined): number {
  const ms = Number(raw);
  if (!raw || !Number.isFinite(ms) || ms <= 0) return DEFAULT_SCENE_MS;
  return Math.min(ms, MAX_SCENE_MS);
}

/** Tracks progress so a paused scene resumes where it stopped instead of restarting. */
export class Playback {
  #remaining: number;
  #startedAt: number | null = null;

  constructor(duration: number) {
    this.#remaining = duration;
  }

  get remaining(): number {
    return this.#remaining;
  }

  get running(): boolean {
    return this.#startedAt !== null;
  }

  resume(now: number): void {
    this.#startedAt ??= now;
  }

  pause(now: number): void {
    if (this.#startedAt === null) return;
    this.#remaining = Math.max(0, this.#remaining - (now - this.#startedAt));
    this.#startedAt = null;
  }
}
