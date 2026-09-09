import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { EffectsLayer } from "./EffectsLayer";

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

function active(layer) {
  return [...layer.activeEffects.keys()];
}

describe("EffectsLayer one-shot feedback", () => {
  it("plays an accepted answer once and captures its streak without later poll changes", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime()));
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 3 })));
    const started = layer.activeEffects.get("correct");
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 4 }), { deltaMs: 100 }));
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41 }), { deltaMs: 100 }));

    expect(active(layer)).toEqual(["correct"]);
    expect(layer.activeEffects.get("correct")).toBe(started);
    expect(started.elapsedMs).toBe(216);
    expect(started.feedbackStreak).toBe(3);
    layer.destroy();
  });

  it("restarts the effect for a second genuine event after an idle gap", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime()));
    layer.update(frame(runtime({ activeEffect: "wrong", feedbackEventId: 41 }), { deltaMs: 300 }));
    layer.update(frame(runtime(), { deltaMs: 100 }));
    layer.update(frame(runtime({ activeEffect: "wrong", feedbackEventId: 42 }), { deltaMs: 0 }));

    expect(layer.activeEffects.get("wrong").elapsedMs).toBe(0);
    layer.destroy();
  });

  it("plays correct at the speed cap on first draw and restarts for the next accepted ID", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 4, targetSpeed: 2 })));
    const first = layer.activeEffects.get("correct");
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 42, feedbackStreak: 5, targetSpeed: 2 })));

    expect(active(layer)).toEqual(["correct"]);
    expect(layer.activeEffects.get("correct")).not.toBe(first);
    expect(layer.activeEffects.get("correct").feedbackStreak).toBe(5);
    layer.destroy();
  });

  it("boosts only on an authoritative speed increase after the first sample", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime({ targetSpeed: 1 })));
    expect(active(layer)).toEqual([]);
    layer.update(frame(runtime({ targetSpeed: 1.3 })));
    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.BOOST]);
    const boost = layer.activeEffects.get(STUDENT_RACE_EFFECT.BOOST);
    layer.update(frame(runtime({ targetSpeed: 1.3 })));
    layer.update(frame(runtime({ targetSpeed: 1.1 })));

    expect(layer.activeEffects.get(STUDENT_RACE_EFFECT.BOOST)).toBe(boost);
    layer.destroy();
  });

  it("plays FINISH once on the authoritative transition and never from an initial true", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime({ playerFinished: true })));
    layer.update(frame(runtime({ playerFinished: true })));
    expect(active(layer)).toEqual([]);
    layer.destroy();

    const second = new EffectsLayer(new Container());
    second.update(frame(runtime({ playerFinished: false })));
    second.update(frame(runtime({ playerFinished: true })));
    second.update(frame(runtime({ playerFinished: true }), { deltaMs: 100 }));

    expect(active(second)).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    expect(second.activeEffects.get(STUDENT_RACE_EFFECT.FINISH).elapsedMs).toBe(116);
    second.destroy();
  });

  it("lets FINISH supersede shorter one-shots and blocks new ones while it plays", () => {
    const layer = new EffectsLayer(new Container());

    layer.playEffect(STUDENT_RACE_EFFECT.CORRECT);
    layer.playEffect(STUDENT_RACE_EFFECT.BOOST);
    layer.playEffect(STUDENT_RACE_EFFECT.FINISH);
    layer.playEffect(STUDENT_RACE_EFFECT.WRONG);

    expect(active(layer)).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    layer.destroy();
  });

  it("ignores unknown effect names", () => {
    const layer = new EffectsLayer(new Container());

    layer.playEffect("fireworks");
    layer.playEffect("constructor");
    layer.playEffect(null);

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

  it("consumes reduced-motion feedback without moving bursts, dust or a later replay", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime({ targetSpeed: 1 }), { deltaMs: 100, visualSpeed: 2 }));
    layer.playEffect(STUDENT_RACE_EFFECT.BOOST);
    layer.update(frame(runtime({
      activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 3,
      targetSpeed: 2, reducedMotion: true,
    }), { deltaMs: 100, visualSpeed: 2 }));

    expect(active(layer)).toEqual([]);
    expect(layer.puffs).toHaveLength(0);
    expect(layer.spawnAccumulator).toBe(0);
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41, targetSpeed: 2 })));
    expect(active(layer)).toEqual([]);
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

  it("keeps a finished player from starting new feedback after the finish animation expires", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame(runtime()));
    layer.update(frame(runtime({ playerFinished: true })));
    layer.update(frame(runtime({
      playerFinished: true, activeEffect: "correct", feedbackEventId: 41, targetSpeed: 2,
    }), { deltaMs: DURATIONS.finishEffectDurationMs }));

    expect(active(layer)).toEqual([]);
    layer.destroy();
  });

  it("releases owned graphics and event history without destroying its shared parent", () => {
    const container = new Container();
    const layer = new EffectsLayer(container);
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 41 })));
    layer.destroy();
    layer.destroy();
    layer.update(frame(runtime({ activeEffect: "correct", feedbackEventId: 42 })));

    expect(layer.graphics.destroyed).toBe(true);
    expect(layer.feedbackGraphics.destroyed).toBe(true);
    expect(layer.observedRuntime).toBeNull();
    expect(active(layer)).toEqual([]);
    expect(container.destroyed).toBe(false);
    expect(container.children).toHaveLength(0);
    container.destroy();
  });
});
