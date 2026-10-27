import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { KART_THRUSTER_PALETTES } from "../../../config/kartThrusterConfig";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { PlayerKartLayer } from "../PlayerKartLayer";

const NOW = 50_000;
const ART_TEXTURE = new Texture({ source: new TextureSource({ width: 768, height: 768 }) });

function luckWindow(type, overrides = {}) {
  return {
    effectId: 7,
    type,
    source: "LUCK_EVENT",
    magnitudeTenths: 1,
    startsAtEpochMs: NOW - 1_000,
    endsAtEpochMs: NOW + 2_000,
    serverClockOffsetMs: 0,
    ...overrides,
  };
}

function frame({ guardShieldCharges = 0, activeEffects = [], playerFinished = false, clientNowEpochMs = NOW } = {}) {
  return {
    deltaMs: 100,
    visualSpeed: 1,
    clientNowEpochMs,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
    runtimeState: {
      playerFinished,
      gameplay: {
        mode: "NORMAL",
        activeEffects,
        powerUps: { guardShieldCharges, guardShieldAwardQuestionId: guardShieldCharges > 0 ? 70 : null },
      },
      visual: { reducedMotion: false },
    },
  };
}

async function loadedLayer() {
  const definition = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN;
  const layer = new PlayerKartLayer(new Container(), {
    loadVehicleAssets: async () => ({ status: "loaded", definition, textures: [ART_TEXTURE] }),
  });
  layer.setVehicleAssetKey("TOY_CAR_GREEN");
  await Promise.resolve();
  return layer;
}

describe("PlayerKartLayer Luck and shield", () => {
  it("raises the shield from the server charges", () => {
    const layer = new PlayerKartLayer(new Container(), { loadVehicleAssets: vi.fn() });

    layer.update(frame({ guardShieldCharges: 1 }));
    expect(layer.luckMarks.shield.visible).toBe(true);
    layer.update(frame());
    expect(layer.luckMarks.shield.visible).toBe(false);
  });

  it("shows a Luck window only while it is open on the frame clock", () => {
    const layer = new PlayerKartLayer(new Container(), { loadVehicleAssets: vi.fn() });
    const tailwind = [luckWindow("SPEED_BOOST")];

    layer.update(frame({ activeEffects: tailwind }));
    expect(layer.luckMarks.wind.visible).toBe(true);
    layer.update(frame({ activeEffects: tailwind, clientNowEpochMs: NOW + 2_000 }));
    expect(layer.luckMarks.wind.visible).toBe(false);
  });

  it("drops every Luck mark once the player has finished", () => {
    const layer = new PlayerKartLayer(new Container(), { loadVehicleAssets: vi.fn() });

    layer.update(frame({ guardShieldCharges: 1, activeEffects: [luckWindow("SPEED_SLOW")], playerFinished: true }));

    expect([layer.luckMarks.shield.visible, layer.luckMarks.mud.visible]).toEqual([false, false]);
  });

  it("dims the nozzles during a Mud window like a challenge slowdown, and only while it is open", async () => {
    const layer = await loadedLayer();
    const mud = [luckWindow("SPEED_SLOW")];

    layer.update(frame({ activeEffects: mud }));
    expect(layer.thrusters.palette).toBe(KART_THRUSTER_PALETTES.slowing);
    layer.update(frame({ activeEffects: mud, clientNowEpochMs: NOW + 2_000 }));
    expect(layer.thrusters.palette).toBeNull();
    layer.destroy();
  });

  it("keeps the shield and the wind above the kart art once it loads", async () => {
    const layer = await loadedLayer();

    expect(layer.kart.getChildIndex(layer.luckMarks.front)).toBe(layer.kart.children.length - 1);
    layer.destroy();
  });
});
