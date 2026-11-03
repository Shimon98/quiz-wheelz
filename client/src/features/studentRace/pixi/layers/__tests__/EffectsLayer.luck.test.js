import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT, STUDENT_RACE_MOMENT } from "../../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { opponentFrame } from "../../opponents/opponentTestFixtures";
import { StudentRaceVehicleVisual } from "../../vehicles/StudentRaceVehicleVisual";
import { artPixelToKartLocal, playerKartGroundTransform } from "../../vehicles/studentRaceVehicleGeometry";
import { EffectsLayer } from "../EffectsLayer";

// The idle pose's highest helmet pixel, measured in the 768 px hover-kart art (Safe and Turbo sit lower).
const HELMET_TOP = Object.freeze({ x: 384, y: 30 });
const ART_FRAME = Object.freeze({ width: 768, height: 768 });

// Where the player's own kart puts its helmet top on screen, through the kart's real transform.
function helmetTopOnScreen({ layout, vehicleVisualScale }) {
  const visual = new StudentRaceVehicleVisual(new Container());
  visual.setGroundTransform({ ...playerKartGroundTransform(layout), visualScale: vehicleVisualScale });
  return visual.root.toGlobal(artPixelToKartLocal(HELMET_TOP, ART_FRAME, STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN)).y;
}

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

  it.each([[360, 640], [390, 844], [430, 932], [768, 1024], [960, 800]])(
    "keeps the whole Energy Orb above the driver's helmet at %sx%s",
    (width, height) => {
      const state = { ...opponentFrame({ width, height }), runtimeState: { visual: { reducedMotion: false } } };
      const helmetY = helmetTopOnScreen(state);
      const layer = new EffectsLayer(new Container());
      layer.update(state);

      layer.playMoments(batch({ type: STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, id: "luck-8" }));
      let frames = 0;
      while (layer.activeEffects.size > 0) {
        layer.update({ ...state, deltaMs: 40 });
        if (layer.feedbackGraphics.context.instructions.length > 0) {
          frames += 1;
          expect(layer.feedbackGraphics.getLocalBounds().maxY).toBeLessThan(helmetY);
        }
      }

      expect(frames).toBeGreaterThan(5);
      layer.destroy();
    },
  );

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

  it("asks only for the burst slots that hold a file, and draws the burst before any art arrives", () => {
    const loadTexture = vi.fn(() => new Promise(() => {}));
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture: vi.fn() });
    layer.update(frame());

    layer.playMoments(batch({ type: STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, id: "luck-7" }));
    layer.update(frame({ deltaMs: 100 }));

    const filled = ["energyOrb", "windLeaf", "mudDrop", "shieldImpact"]
      .map((slot) => LUCK_EFFECT_ART[slot].url).filter((url) => url != null);
    // The V4 paintings load beside them; of the Luck art, only the burst slots are asked for.
    const luckUrls = Object.values(LUCK_EFFECT_ART).map(({ url }) => url);
    expect(loadTexture.mock.calls.map(([url]) => url).filter((url) => luckUrls.includes(url))).toEqual(filled);
    const actions = layer.feedbackGraphics.context.instructions.map(({ action }) => action);
    expect(actions).not.toContain("texture");
    expect(actions.length).toBeGreaterThan(0);
    layer.destroy();
  });

  it("plays no Luck burst under reduced motion", () => {
    const layer = new EffectsLayer(new Container());
    layer.update(frame({ reducedMotion: true }));

    layer.playMoments(batch({ type: STUDENT_RACE_MOMENT.LUCK_MUD, id: "luck-6" }));

    expect(layer.activeEffects.size).toBe(0);
    layer.destroy();
  });

  it("raises no dust from the mud puddle while a Mud window is open", () => {
    const now = 50_000;
    const mud = { effectId: 7, type: "SPEED_SLOW", source: "LUCK_EVENT", magnitudeTenths: 1,
      startsAtEpochMs: now - 1_000, endsAtEpochMs: now + 2_000, serverClockOffsetMs: 0 };
    const moving = (activeEffects) => ({ ...frame({ deltaMs: 500 }), visualSpeed: 2, clientNowEpochMs: now,
      runtimeState: { visual: { reducedMotion: false }, gameplay: { activeEffects } } });
    const inMud = new EffectsLayer(new Container());
    const dry = new EffectsLayer(new Container());

    inMud.update(moving([mud]));
    dry.update(moving([]));

    expect(inMud.puffs).toHaveLength(0);
    expect(dry.puffs.length).toBeGreaterThan(0);
    inMud.destroy();
    dry.destroy();
  });
});
