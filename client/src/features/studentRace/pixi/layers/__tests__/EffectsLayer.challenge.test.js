import { Container, Graphics } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { drawFeedbackEffect } from "../../effects/drawFeedbackEffect";
import { EffectsLayer } from "../EffectsLayer";

const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;
const RESULT_EFFECTS = [
  [STUDENT_RACE_EFFECT.TURBO_SUCCESS, DURATIONS.turboSuccessEffectDurationMs],
  [STUDENT_RACE_EFFECT.TURBO_FAILURE, DURATIONS.turboFailureEffectDurationMs],
  [STUDENT_RACE_EFFECT.SAFE_COMPLETE, DURATIONS.safeCompleteEffectDurationMs],
  [STUDENT_RACE_EFFECT.SAFE_PERFECT, DURATIONS.safePerfectEffectDurationMs],
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

describe("EffectsLayer challenge results", () => {
  it.each(RESULT_EFFECTS)("plays the %s result for its own duration, then clears it", (effect, durationMs) => {
    expect(durationMs).toBeGreaterThan(0);
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch({ type: effect, id: "challenge-1" }));
    layer.update(frame({ deltaMs: durationMs - 1 }));
    expect([...layer.activeEffects.keys()]).toEqual([effect]);

    layer.update(frame({ deltaMs: 1 }));
    expect(layer.activeEffects.size).toBe(0);
    layer.destroy();
  });

  it("lets a challenge result replace the answer effect it arrived with", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch(
      { type: STUDENT_RACE_EFFECT.CORRECT, id: 17, streak: 0 },
      { type: STUDENT_RACE_EFFECT.TURBO_SUCCESS, id: "challenge-3" },
    ));

    expect([...layer.activeEffects.keys()]).toEqual([STUDENT_RACE_EFFECT.TURBO_SUCCESS]);
    layer.destroy();
  });

  it("keeps the finish on top of a result that comes after it", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame());

    layer.playMoments(batch({ type: STUDENT_RACE_EFFECT.FINISH, id: "finish" }));
    layer.playMoments(batch({ type: STUDENT_RACE_EFFECT.TURBO_SUCCESS, id: "challenge-2" }));

    expect([...layer.activeEffects.keys()]).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    layer.destroy();
  });

  it("plays no result animation under reduced motion", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame({ reducedMotion: true }));

    layer.playMoments(batch({ type: STUDENT_RACE_EFFECT.SAFE_PERFECT, id: "challenge-3" }));

    expect(layer.activeEffects.size).toBe(0);
    layer.destroy();
  });

  it.each(RESULT_EFFECTS)("draws %s at every stage of its life", (effect) => {
    const graphics = new Graphics();
    const geometry = { x: 260, y: 420, groundY: 443, bottomY: 518, size: 177, width: 520 };

    for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
      graphics.clear();
      drawFeedbackEffect(graphics, effect, progress, geometry);
    }

    expect(graphics.context.instructions.length).toBeGreaterThanOrEqual(0);
    graphics.destroy();
  });
});
