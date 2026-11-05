/** Motion policy, the AI demo's timeline and tab keys (ADR-004 §3). Pure, so it is unit-tested. */

export interface MotionEnv {
  reducedMotion: boolean;
  reducedData: boolean;
  saveData: boolean;
}

/** Any of the three preferences turns every marquee, reveal and playback off. */
export function motionAllowed(env: MotionEnv): boolean {
  return !env.reducedMotion && !env.reducedData && !env.saveData;
}

/** Timings from docs/design/motion.md: the whole run stops by itself after about 5.7 s. */
export const DEMO_TYPE_MS = 2400;
export const DEMO_STEP_MS = 750;
const DEMO_RESULT_DELAY_MS = 300;

export function demoEnd(stepCount: number): number {
  return DEMO_TYPE_MS + DEMO_STEP_MS * stepCount + DEMO_RESULT_DELAY_MS;
}

export interface DemoFrame {
  /** Characters of the prompt typed so far. */
  typed: number;
  /** Index of the running step, or -1 while typing or once all are done. */
  active: number;
  /** Steps finished so far. */
  done: number;
  resultShown: boolean;
}

export function demoFrame(
  elapsed: number,
  textLength: number,
  stepCount: number,
): DemoFrame {
  const stepTime = elapsed - DEMO_TYPE_MS;
  const done = Math.max(
    0,
    Math.min(stepCount, Math.floor(stepTime / DEMO_STEP_MS)),
  );
  return {
    typed: Math.min(
      textLength,
      Math.round((Math.max(0, elapsed) / DEMO_TYPE_MS) * textLength),
    ),
    active: stepTime >= 0 && done < stepCount ? done : -1,
    done,
    resultShown: elapsed >= demoEnd(stepCount),
  };
}

/** The tab a key moves to, or undefined for keys the tablist does not handle. */
export function tabTarget(
  key: string,
  index: number,
  count: number,
): number | undefined {
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}
