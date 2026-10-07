import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { EffectsLayer } from "../EffectsLayer";

const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;

function runtime({
  activeEffect = null, targetSpeed = 1, playerFinished = false,
  feedbackEventId = null, feedbackStreak = 0, reducedMotion = false,
} = {}) {
  return {
    playerFinished,
    visual: { activeEffect, targetSpeed, feedbackEventId, feedbackStreak, reducedMotion },
  };
}

function frame(runtimeState, { deltaMs = 16, visualSpeed = 0 } = {}) {
  return {
    deltaMs,
    width: 520,
    height: 800,
    visualSpeed,
    layout: {
      world: { bottomY: 518 },
      playerKart: { anchorX: 260, anchorY: 420, maxWidth: 177, dustOriginY: 443 },
    },
    runtimeState,
  };
}

const batch = (id, ...moments) => ({ id, moments });

function active(layer) {
  return [...layer.activeEffects.keys()];
}

describe("EffectsLayer one-shot feedback", () => {
  it("draws each delivered moment with the streak it carries", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime()));

    layer.playMoments(batch(1, { type: STUDENT_RACE_EFFECT.CORRECT, id: 41, streak: 3 }));
    layer.update(frame(runtime(), { deltaMs: 100 }));

    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.CORRECT]);
    expect(layer.activeEffects.get("correct")).toMatchObject({ elapsedMs: 100, feedbackStreak: 3 });
    layer.destroy();
  });

  it("restarts an effect for the next delivered moment of the same kind", () => {
    const layer = new EffectsLayer(new Container());
    layer.playMoments(batch(1, { type: STUDENT_RACE_EFFECT.WRONG, id: 41 }));
    layer.update(frame(runtime(), { deltaMs: 300 }));

    layer.playMoments(batch(2, { type: STUDENT_RACE_EFFECT.WRONG, id: 42 }));

    expect(layer.activeEffects.get("wrong").elapsedMs).toBe(0);
    layer.destroy();
  });

  it("never discovers moments on its own from runtime frames", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime()));
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 4 })));
    layer.update(frame(runtime({ playerFinished: true, targetSpeed: 2 })));

    expect(active(layer)).toEqual([]);
    layer.destroy();
  });

  it("lets FINISH supersede shorter one-shots and blocks new ones while it plays", () => {
    const layer = new EffectsLayer(new Container());

    layer.playEffect(STUDENT_RACE_EFFECT.CORRECT);
    layer.playEffect(STUDENT_RACE_EFFECT.BOOST);
    layer.playMoments(batch(1, { type: STUDENT_RACE_EFFECT.FINISH, id: "finish" }));
    layer.playMoments(batch(2, { type: STUDENT_RACE_EFFECT.WRONG, id: 43 }));

    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    layer.destroy();
  });

  it("ignores unknown effect names", () => {
    const layer = new EffectsLayer(new Container());

    layer.playEffect("fireworks");
    layer.playEffect("constructor");
    layer.playMoments(batch(1, { type: null, id: 1 }));

    expect(active(layer)).toEqual([]);
    layer.destroy();
  });

  it("expires effects by deltaMs using the configured durations", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime()));

    layer.playEffect(STUDENT_RACE_EFFECT.WRONG);
    layer.playEffect(STUDENT_RACE_EFFECT.CORRECT);
    layer.update(frame(runtime(), { deltaMs: DURATIONS.wrongEffectDurationMs - 1 }));
    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.WRONG, STUDENT_RACE_EFFECT.CORRECT]);

    layer.update(frame(runtime(), { deltaMs: 1 }));
    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.CORRECT]);

    layer.update(frame(runtime(), { deltaMs: DURATIONS.correctEffectDurationMs }));
    expect(active(layer)).toEqual([]);
    layer.destroy();
  });

  it("keeps the ambient dust running alongside effects", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime()));
    layer.playEffect(STUDENT_RACE_EFFECT.BOOST);

    for (let i = 0; i < 10; i += 1) {
      layer.update(frame(runtime(), { deltaMs: 50, visualSpeed: 1.5 }));
    }

    expect(layer.puffs.length).toBeGreaterThan(0);
    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.BOOST]);
    layer.destroy();
  });

  it("draws nothing in reduced motion: no bursts, no dust and no delivered moment", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime({ targetSpeed: 1 }), { deltaMs: 100, visualSpeed: 2 }));
    layer.playEffect(STUDENT_RACE_EFFECT.BOOST);
    layer.update(frame(runtime({ reducedMotion: true }), { deltaMs: 100, visualSpeed: 2 }));

    layer.playMoments(batch(1, { type: STUDENT_RACE_EFFECT.CORRECT, id: 41, streak: 3 }));

    expect(active(layer)).toEqual([]);
    expect(layer.puffs).toHaveLength(0);
    expect(layer.spawnAccumulator).toBe(0);
    layer.destroy();
  });

  it("drops dust overflow instead of accumulating a delayed burst", () => {
    const layer = new EffectsLayer(new Container());
    layer.spawnPuffs(260, 443, 100, 10000, 520);
    layer.spawnPuffs(260, 443, 100, 10000, 520);

    expect(layer.puffs).toHaveLength(36);
    expect(layer.spawnAccumulator).toBeLessThan(1);
    layer.agePuffs(1000);
    layer.spawnPuffs(260, 443, 0, 16, 520);
    expect(layer.puffs).toHaveLength(0);
    layer.destroy();
  });

  it("releases owned graphics and ignores moments after destroy, without destroying its shared parent", () => {
    const container = new Container();
    const layer = new EffectsLayer(container);
    layer.playMoments(batch(1, { type: STUDENT_RACE_EFFECT.CORRECT, id: 41 }));
    layer.destroy();
    layer.destroy();
    layer.playMoments(batch(2, { type: STUDENT_RACE_EFFECT.CORRECT, id: 42 }));

    expect(layer.graphics.destroyed).toBe(true);
    expect(layer.feedbackGraphics.destroyed).toBe(true);
    expect(active(layer)).toEqual([]);
    expect(container.destroyed).toBe(false);
    expect(container.children).toHaveLength(0);
    container.destroy();
  });
});
