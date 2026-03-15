import { describe, it, expect } from 'vitest';

// Constants mirrored from the game
const GRAVITY = 980;
const MAX_FALL = 600;

function applyGravity(vy: number, dt: number): number {
  return vy + GRAVITY * dt;
}

function capFallSpeed(vy: number): number {
  return Math.min(vy, MAX_FALL);
}

function aabbOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

describe('Physics', () => {
  it('applies gravity correctly over delta time', () => {
    const vy0 = 0;
    const dt = 1 / 60; // one frame at 60fps
    const vy1 = applyGravity(vy0, dt);
    expect(vy1).toBeCloseTo(GRAVITY * dt);
    expect(vy1).toBeGreaterThan(0);
  });

  it('gravity accumulates over multiple frames', () => {
    let vy = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      vy = applyGravity(vy, dt);
    }
    // After 1 second, vy should be approx GRAVITY (before cap)
    expect(vy).toBeCloseTo(GRAVITY, 0);
  });

  it('caps velocity at MAX_FALL', () => {
    let vy = 0;
    const dt = 1 / 60;
    // Simulate many frames of falling
    for (let i = 0; i < 200; i++) {
      vy = capFallSpeed(applyGravity(vy, dt));
    }
    expect(vy).toBeLessThanOrEqual(MAX_FALL);
    expect(vy).toBe(MAX_FALL);
  });

  it('velocity does not exceed MAX_FALL immediately', () => {
    const highVy = MAX_FALL + 100;
    const capped = capFallSpeed(highVy);
    expect(capped).toBe(MAX_FALL);
  });

  it('AABB overlap detection - overlapping rects', () => {
    // Two overlapping 32x32 squares
    expect(aabbOverlap(0, 0, 32, 32, 16, 16, 32, 32)).toBe(true);
  });

  it('AABB overlap detection - non overlapping rects', () => {
    // Rects separated horizontally
    expect(aabbOverlap(0, 0, 32, 32, 40, 0, 32, 32)).toBe(false);
  });

  it('AABB overlap detection - touching edges (not overlapping)', () => {
    // Rects touching at right/left edge
    expect(aabbOverlap(0, 0, 32, 32, 32, 0, 32, 32)).toBe(false);
  });

  it('AABB overlap detection - one inside the other', () => {
    expect(aabbOverlap(0, 0, 64, 64, 10, 10, 20, 20)).toBe(true);
  });
});
