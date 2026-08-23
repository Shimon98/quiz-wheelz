import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { EffectsLayer } from "./EffectsLayer";

const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;

function runtime({ activeEffect = null, targetSpeed = 1, playerFinished = false } = {}) {
  return { playerFinished, visual: { activeEffect, targetSpeed } };
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
  it("plays an answer effect once per genuine state edge, not per ticker frame", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime()));
    layer.update(frame(runtime({ activeEffect: "correct" })));
    const started = layer.activeEffects.get("correct");
    layer.update(frame(runtime({ activeEffect: "correct" }), { deltaMs: 100 }));
    layer.update(frame(runtime({ activeEffect: "correct" }), { deltaMs: 100 }));

    expect(active(layer)).toEqual(["correct"]);
    expect(layer.activeEffects.get("correct")).toBe(started);
    expect(started.elapsedMs).toBe(216);
    layer.destroy();
  });

  it("restarts the effect for a second genuine event after an idle gap", () => {
    const layer = new EffectsLayer(new Container());

    layer.update(frame(runtime()));
    layer.update(frame(runtime({ activeEffect: "wrong" }), { deltaMs: 300 }));
    layer.update(frame(runtime(), { deltaMs: 100 }));
    layer.update(frame(runtime({ activeEffect: "wrong" }), { deltaMs: 0 }));

    expect(layer.activeEffects.get("wrong").elapsedMs).toBe(0);
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
});
