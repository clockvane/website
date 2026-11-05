import { describe, expect, it } from 'vitest';
import {
  DEMO_STEP_MS,
  DEMO_TYPE_MS,
  demoEnd,
  demoFrame,
  motionAllowed,
  tabTarget,
} from '../../../../src/lib/motion/policy';

describe('motionAllowed', () => {
  const on = { reducedMotion: false, reducedData: false, saveData: false };
  it('needs all three preferences off', () => {
    expect(motionAllowed(on)).toBe(true);
    expect(motionAllowed({ ...on, reducedMotion: true })).toBe(false);
    expect(motionAllowed({ ...on, reducedData: true })).toBe(false);
    expect(motionAllowed({ ...on, saveData: true })).toBe(false);
  });
});

describe('demoFrame', () => {
  it('types, then runs each step, then shows the result', () => {
    expect(demoFrame(0, 100, 4)).toEqual({
      typed: 0,
      active: -1,
      done: 0,
      resultShown: false,
    });
    expect(demoFrame(DEMO_TYPE_MS / 2, 100, 4).typed).toBe(50);
    const second = demoFrame(DEMO_TYPE_MS + DEMO_STEP_MS, 100, 4);
    expect(second).toMatchObject({ typed: 100, active: 1, done: 1 });
    expect(demoFrame(demoEnd(4) - 1, 100, 4)).toMatchObject({
      active: -1,
      done: 4,
      resultShown: false,
    });
    expect(demoFrame(demoEnd(4), 100, 4).resultShown).toBe(true);
  });

  it('stops by itself in about 5.7 s, as motion.md specifies', () => {
    expect(demoEnd(4)).toBe(5700);
  });
});

describe('tabTarget', () => {
  it('wraps with arrows, jumps with Home and End, ignores other keys', () => {
    expect(tabTarget('ArrowRight', 3, 4)).toBe(0);
    expect(tabTarget('ArrowLeft', 0, 4)).toBe(3);
    expect(tabTarget('Home', 2, 4)).toBe(0);
    expect(tabTarget('End', 0, 4)).toBe(3);
    expect(tabTarget('a', 0, 4)).toBeUndefined();
  });
});
