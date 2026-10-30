import { describe, expect, it } from 'vitest';
import {
  MAX_SCENE_MS,
  Playback,
  motionAllowed,
  sceneDuration,
} from '../../../../src/lib/motion/policy';

const none = { reducedMotion: false, reducedData: false, saveData: false };

describe('motionAllowed', () => {
  it('allows motion only when no reduction preference is set', () => {
    expect(motionAllowed(none)).toBe(true);
    expect(motionAllowed({ ...none, reducedMotion: true })).toBe(false);
    expect(motionAllowed({ ...none, reducedData: true })).toBe(false);
    expect(motionAllowed({ ...none, saveData: true })).toBe(false);
  });
});

describe('sceneDuration', () => {
  it('falls back for missing or invalid values and caps at 2.4 s', () => {
    expect(sceneDuration(undefined)).toBe(1800);
    expect(sceneDuration('abc')).toBe(1800);
    expect(sceneDuration('-5')).toBe(1800);
    expect(sceneDuration('1200')).toBe(1200);
    expect(sceneDuration('9000')).toBe(MAX_SCENE_MS);
  });
});

describe('Playback', () => {
  it('resumes with the remaining time after a pause', () => {
    const p = new Playback(1800);
    p.resume(1000);
    expect(p.running).toBe(true);
    p.pause(1500);
    expect(p.remaining).toBe(1300);
    expect(p.running).toBe(false);
    p.pause(2000); // pausing twice changes nothing
    expect(p.remaining).toBe(1300);
    p.resume(3000);
    p.resume(3100); // resuming twice keeps the first start
    p.pause(5000);
    expect(p.remaining).toBe(0);
  });
});
