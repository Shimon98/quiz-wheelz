import { describe, expect, it } from "vitest";

import { STUDENT_RACE_MOMENT } from "../../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_DRAWERS } from "../drawLuckEffect";

const KART = Object.freeze({ x: 260, y: 420, size: 177, groundY: 443, bottomY: 518, width: 520 });
const LUCK_MOMENTS = [
  STUDENT_RACE_MOMENT.LUCK_TAILWIND,
  STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB,
  STUDENT_RACE_MOMENT.LUCK_MUD,
  STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED,
];

// Records what a drawer asks Graphics to paint, without a renderer.
function recorder() {
  const calls = [];
  let shape = null;
  const g = {
    circle(x, y, radius) { shape = { kind: "circle", x, y, radius }; return g; },
    ellipse(x, y, rx, ry) { shape = { kind: "ellipse", x, y, radius: Math.max(rx, ry) }; return g; },
    roundRect(x, y, w, h) { shape = { kind: "rect", x, y, radius: Math.max(w, h) }; return g; },
    fill(style) { calls.push({ ...shape, alpha: style.alpha }); return g; },
    stroke(style) { calls.push({ ...shape, alpha: style.alpha }); return g; },
  };
  return { g, calls };
}

function paint(effect, progress) {
  const { g, calls } = recorder();
  LUCK_EFFECT_DRAWERS[effect](g, KART, progress);
  return calls;
}

describe("Luck one-shot effects", () => {
  it("has a drawer for every Luck moment", () => {
    expect(Object.keys(LUCK_EFFECT_DRAWERS).sort()).toEqual([...LUCK_MOMENTS].sort());
  });

  it.each(LUCK_MOMENTS)("paints %s at mid-life and leaves nothing visible at its end", (effect) => {
    expect(paint(effect, 0.4).some(({ alpha }) => alpha > 0.05)).toBe(true);
    expect(paint(effect, 1).every(({ alpha }) => alpha <= 0.001)).toBe(true);
  });

  it.each(LUCK_MOMENTS)("keeps %s inside the road view", (effect) => {
    for (const progress of [0.1, 0.5, 0.9]) {
      paint(effect, progress).forEach(({ x }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(KART.width);
      });
    }
  });
});
