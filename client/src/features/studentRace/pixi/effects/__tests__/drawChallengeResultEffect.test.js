import { describe, expect, it } from "vitest";

import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { CHALLENGE_RESULT_DRAWERS } from "../drawChallengeResultEffect";

const KART = Object.freeze({ x: 260, y: 420, size: 177, groundY: 443, bottomY: 518 });

// Records what a drawer asks Graphics to paint, without a renderer.
function recorder() {
  const calls = [];
  let shape = null;
  const g = {
    circle(x, y, radius) { shape = { kind: "circle", x, y, radius }; return g; },
    star(x, y, points, radius) { shape = { kind: "star", x, y, radius }; return g; },
    ellipse(x, y, rx, ry) { shape = { kind: "ellipse", x, y, rx, ry, radius: Math.max(rx, ry) }; return g; },
    roundRect(x, y, w, h) { shape = { kind: "rect", x, y, radius: Math.max(w, h) }; return g; },
    fill(style) { calls.push({ ...shape, fill: style }); return g; },
    stroke(style) { calls.push({ ...shape, stroke: style }); return g; },
  };
  return { g, calls };
}

function paint(effect, progress) {
  const { g, calls } = recorder();
  CHALLENGE_RESULT_DRAWERS[effect](g, KART, progress);
  return calls;
}

describe("Turbo success result effect", () => {
  it("keeps the celebration free of sparkles and filled ground discs", () => {
    for (const progress of [0, 0.2, 0.5, 0.9]) {
      const calls = paint(STUDENT_RACE_EFFECT.TURBO_SUCCESS, progress);
      expect(calls.filter(({ kind }) => ["star", "circle", "ellipse"].includes(kind))).toEqual([]);
    }
  });
  it.each([0.1, 0.3, 0.6])("leaves the nozzles to the engine fire: no flat discs over them (progress %s)", (progress) => {
    const nozzles = [-1, 1].map((side) => ({ x: KART.x + side * KART.size * 0.31, y: KART.y + KART.size * 0.08 }));
    const discs = paint(STUDENT_RACE_EFFECT.TURBO_SUCCESS, progress).filter((call) => call.fill && call.kind === "circle"
      && nozzles.some((n) => Math.hypot(call.x - n.x, call.y - n.y) < KART.size * 0.1));

    expect(discs).toEqual([]);
  });

  it.each([0.1, 0.3, 0.6])("draws no streaks down the road behind the kart (progress %s)", (progress) => {
    const streaks = paint(STUDENT_RACE_EFFECT.TURBO_SUCCESS, progress)
      .filter((call) => call.kind === "rect" && Math.abs(call.x - KART.x) < KART.size * 0.5);

    expect(streaks).toEqual([]);
  });

  it("adds speed lines along both sides of the screen, clear of the kart", () => {
    const { g, calls } = recorder();
    CHALLENGE_RESULT_DRAWERS[STUDENT_RACE_EFFECT.TURBO_SUCCESS](g, { ...KART, width: 390 }, 0.5);
    const sides = calls.filter((call) => call.kind === "rect" && Math.abs(call.x - KART.x) > KART.size * 0.6);

    expect(sides.some((call) => call.x < KART.x)).toBe(true);
    expect(sides.some((call) => call.x > KART.x)).toBe(true);
    sides.forEach((call) => {
      expect(call.x).toBeGreaterThanOrEqual(0);
      expect(call.x).toBeLessThanOrEqual(390);
    });
  });
});

describe.each([STUDENT_RACE_EFFECT.SAFE_COMPLETE, STUDENT_RACE_EFFECT.SAFE_PERFECT])("%s restrained result", (effect) => {
  it("uses a thin shallow ground ripple with no particles, filled discs or driver halo", () => {
    for (const progress of [0.15, 0.4, 0.5, 0.7, 0.9]) {
      const calls = paint(effect, progress);
      expect(calls).toHaveLength(1);
      const ring = calls[0];
      expect(ring.kind).toBe("ellipse");
      expect(ring.fill).toBeUndefined();
      expect(ring.y).toBe(KART.groundY);
      expect(ring.ry).toBeLessThanOrEqual(KART.size * 0.12);
      expect(ring.rx).toBeLessThanOrEqual(KART.size * 0.62);
      expect(ring.stroke.alpha).toBeLessThanOrEqual(0.26);
      expect(ring.stroke.width).toBeLessThanOrEqual(1.5);
    }
  });

  it("starts and ends without a flash or abrupt disappearance", () => {
    expect(paint(effect, 0)).toEqual([]);
    expect(paint(effect, 1)).toEqual([]);
    const start = paint(effect, 0.1)[0].stroke.alpha;
    const middle = paint(effect, 0.5)[0].stroke.alpha;
    const end = paint(effect, 0.9)[0].stroke.alpha;
    expect(start).toBeLessThan(middle);
    expect(end).toBeCloseTo(start);
  });
});
