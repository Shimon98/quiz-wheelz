import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT, STUDENT_RACE_MOMENT } from "../../../runtime/studentRaceRuntimeConstants";
import { EffectsLayer } from "../EffectsLayer";

const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;
const LUCK_EFFECTS = [
  [STUDENT_RACE_MOMENT.LUCK_TAILWIND, DURATIONS.luckTailwindEffectDurationMs],
  [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, DURATIONS.luckEnergyOrbEffectDurationMs],
  [STUDENT_RACE_MOMENT.LUCK_MUD, DURATIONS.luckMudEffectDurationMs],
  [STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED, DURATIONS.luckShieldBlockedEffectDurationMs],
];

function frame({ deltaMs = 16, reducedMotion = false } = {}) {
  return {
    deltaMs,
    width: 520,
    height: 800,
    visualSpeed: 0,
    layout: {
      world: { bottomY: 518 },
      playerKart: { anchorX: 260, anchorY: 420, maxWidth: 177, dustOriginY: 443 },
    },
    runtimeState: { visual: { reducedMotion } },
  };
}

const batch = (...moments) => ({ id: 1, moments });

describe("EffectsLayer Luck moments", () => {
  it.each(LUCK_EFFECTS)("plays %s for its own short duration, then clears it", (effect, durationMs) => {
    expect(durationMs).toBeGreaterThan(0);
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch({ type: effect, id: "luck-1" }));
    layer.update(frame({ deltaMs: durationMs - 1 }));
    expect([...layer.activeEffects.keys()]).toEqual([effect]);
    expect(layer.feedbackGraphics.context.instructions.length).toBeGreaterThan(0);

    layer.update(frame({ deltaMs: 1 }));
    expect(layer.activeEffects.size).toBe(0);
    layer.destroy();
  });

  it("plays Luck next to the challenge result it arrived with", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch(
      { type: STUDENT_RACE_EFFECT.TURBO_FAILURE, id: "challenge-3" },
      { type: STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED, id: "luck-4" },
    ));

    expect([...layer.activeEffects.keys()])
      .toEqual([STUDENT_RACE_EFFECT.TURBO_FAILURE, STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED]);
    layer.destroy();
  });

  it("lets the finish outrank Luck", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch({ type: STUDENT_RACE_EFFECT.FINISH, id: "finish" }));
    layer.playMoments(batch({ type: STUDENT_RACE_MOMENT.LUCK_TAILWIND, id: "luck-5" }));

    expect([...layer.activeEffects.keys()]).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    layer.destroy();
  });

  it("plays no Luck burst under reduced motion", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame({ reducedMotion: true }));

    layer.playMoments(batch({ type: STUDENT_RACE_MOMENT.LUCK_MUD, id: "luck-6" }));

    expect(layer.activeEffects.size).toBe(0);
    layer.destroy();
  });
});
