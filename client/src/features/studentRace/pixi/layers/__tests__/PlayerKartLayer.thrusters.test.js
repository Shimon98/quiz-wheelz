import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { KART_THRUSTER_PALETTES } from "../../../config/kartThrusterConfig";
import { RACE_GAMEPLAY_PRESENTATION } from "../../../config/raceGameplayPresentationConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { PlayerKartLayer } from "../PlayerKartLayer";

const ART_TEXTURE = new Texture({ source: new TextureSource({ width: 768, height: 768 }) });

async function loadedLayer(status = "loaded") {
  const definition = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN;
  const layer = new PlayerKartLayer(new Container(), {
    loadVehicleAssets: async () => (status === "loaded"
      ? { status, definition, textures: [ART_TEXTURE] }
      : { status }),
  });
  layer.setVehicleAssetKey("TOY_CAR_GREEN");
  await Promise.resolve();
  return layer;
}

function frame(mode, { reducedMotion = false, deltaMs = 400 } = {}) {
  return {
    deltaMs,
    visualSpeed: 1,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
    runtimeState: { gameplay: { mode }, visual: { reducedMotion } },
  };
}

describe("PlayerKartLayer thrusters", () => {
  it("draws the thrusters above the art, inside the bobbing kart", async () => {
    const layer = await loadedLayer();

    expect(layer.thrusters.container.parent).toBe(layer.kart);
    expect(layer.kart.getChildIndex(layer.thrusters.container))
      .toBeGreaterThan(layer.kart.getChildIndex(layer.fade.surface));
    layer.destroy();
  });

  it.each([
    ["SAFE_RUN", RACE_GAMEPLAY_PRESENTATION.SAFE_RUN.kartThrusters],
  ])("lights the thrusters in the %s colors from the presentation table", async (mode, palette) => {
    const layer = await loadedLayer();

    layer.update(frame(mode));

    expect(palette).toBeTruthy();
    expect(layer.thrusters.palette).toBe(palette);
    expect(layer.thrusters.container.visible).toBe(true);
    layer.destroy();
  });

  it.each(["NORMAL", "TURBO_TRIAL", "CHALLENGE_CHOICE", "FUTURE_MODE"])("keeps the original art in mode %s", async (mode) => {
    const layer = await loadedLayer();

    layer.update(frame(mode));

    expect(layer.thrusters.container.visible).toBe(false);
    layer.destroy();
  });

  it("keeps the placeholder kart free of thrusters when the art is missing", async () => {
    const layer = await loadedLayer("fallback");

    layer.update(frame("TURBO_TRIAL"));

    expect(layer.thrusters.container.visible).toBe(false);
    layer.destroy();
  });

  it.each(["CHALLENGE_TIMEOUT", "TURBO_FAILURE"])("dims the nozzles only while the server reports %s", async (source) => {
    const layer = await loadedLayer();
    const state = frame("NORMAL");
    state.runtimeState.gameplay.activeEffects = [{ type: "SPEED_SLOW", source, effectId: 1 }];
    layer.update(state);
    expect(layer.thrusters.palette).toBe(KART_THRUSTER_PALETTES.slowing);
    expect(layer.thrusters.steady.nozzles.every(n => !n.flame.visible && n.rays.context.instructions.length === 0)).toBe(true);
    layer.update(frame("NORMAL"));
    expect(layer.thrusters.palette).toBeNull();
    expect(layer.thrusters.container.visible).toBe(false);
    layer.destroy();
  });

  it("plays a challenge result delivered in a moment batch", async () => {
    const layer = await loadedLayer();
    layer.update(frame("NORMAL", { deltaMs: 16 }));

    layer.playMoments({ id: 1, moments: [{ type: STUDENT_RACE_EFFECT.TURBO_SUCCESS, id: "challenge-5" }] });
    layer.update(frame("NORMAL", { deltaMs: 16 }));

    expect(layer.thrusters.oneShot.type).toBe(STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    layer.destroy();
  });
});
