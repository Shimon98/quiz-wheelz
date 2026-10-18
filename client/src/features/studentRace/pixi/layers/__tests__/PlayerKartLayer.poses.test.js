import { Container, Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { PlayerKartLayer } from "../PlayerKartLayer";

const { poseFadeMs } = STUDENT_RACE_ANIMATION_CONFIG.kartPoses;

const texture = () => new Texture({ source: new TextureSource({ width: 768, height: 768 }) });
const IDLE = texture();
const SAFE = texture();
const DEFINITION = Object.freeze({
  ...STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN,
  poses: Object.freeze({ SAFE_RUN: "safe.webp", TURBO_TRIAL: "turbo.webp" }),
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

async function layerWith({ definition = DEFINITION, loadPoseTexture } = {}) {
  const layer = new PlayerKartLayer(new Container(), {
    loadVehicleAssets: async () => ({ status: "loaded", definition, textures: [IDLE] }),
    loadPoseTexture,
  });
  layer.setVehicleAssetKey("TOY_CAR_GREEN");
  await Promise.resolve();
  return layer;
}

function frame(mode) {
  return {
    deltaMs: 16,
    visualSpeed: 1,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
    runtimeState: { gameplay: { mode }, visual: { reducedMotion: false } },
  };
}

const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });
const settle = (layer, mode) => { for (let ms = 0; ms <= poseFadeMs; ms += 16) layer.update(frame(mode)); };

afterEach(() => vi.restoreAllMocks());

describe("PlayerKartLayer challenge poses", () => {
  it("keeps the original art and loads nothing until a challenge mode starts", async () => {
    const loadPoseTexture = vi.fn();
    const layer = await layerWith({ loadPoseTexture });

    layer.update(frame("NORMAL"));
    layer.update(frame("CHALLENGE_CHOICE"));

    expect(loadPoseTexture).not.toHaveBeenCalled();
    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });

  it.each([["SAFE_RUN", SAFE, "safe.webp"]])(
    "shows the %s pose once it has loaded, then the original art again in NORMAL",
    async (mode, poseTexture, url) => {
      const loadPoseTexture = vi.fn(async () => poseTexture);
      const layer = await layerWith({ loadPoseTexture });

      layer.update(frame(mode));
      expect(layer.artSprite.texture).toBe(IDLE);
      await flush();
      settle(layer, mode);
      expect(layer.artSprite.texture).toBe(poseTexture);
      expect(loadPoseTexture).toHaveBeenCalledWith(url);

      settle(layer, "NORMAL");
      expect(layer.artSprite.texture).toBe(IDLE);
      layer.destroy();
    },
  );

  it("loads each pose once, however many frames ask for it", async () => {
    const loadPoseTexture = vi.fn(async () => SAFE);
    const layer = await layerWith({ loadPoseTexture });

    for (let i = 0; i < 5; i += 1) layer.update(frame("SAFE_RUN"));
    await flush();
    settle(layer, "NORMAL");
    settle(layer, "SAFE_RUN");

    expect(loadPoseTexture).toHaveBeenCalledTimes(1);
    expect(layer.artSprite.texture).toBe(SAFE);
    layer.destroy();
  });

  it("never shows a pose that arrives after its mode has ended", async () => {
    const pending = deferred();
    const layer = await layerWith({ loadPoseTexture: () => pending.promise });

    layer.update(frame("SAFE_RUN"));
    layer.update(frame("NORMAL"));
    pending.resolve(SAFE);
    await flush();
    layer.update(frame("NORMAL"));

    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });

  it("keeps the original art when a pose fails to load or the kart has no poses", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = await layerWith({ loadPoseTexture: () => Promise.reject(new Error("offline")) });
    failing.update(frame("SAFE_RUN"));
    await flush();
    failing.update(frame("SAFE_RUN"));
    expect(failing.artSprite.texture).toBe(IDLE);
    failing.destroy();

    const plain = await layerWith({ definition: { ...DEFINITION, poses: undefined }, loadPoseTexture: vi.fn() });
    plain.update(frame("TURBO_TRIAL"));
    expect(plain.artSprite.texture).toBe(IDLE);
    plain.destroy();
  });

  it("gives every manifest colour both poses at the shared art size and anchor", () => {
    Object.values(STUDENT_RACE_VEHICLE_MANIFEST).forEach((definition) => {
      expect(Object.keys(definition.poses).sort()).toEqual(["SAFE_RUN", "TURBO_TRIAL"]);
      expect(definition.anchorY).toBe(STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN.anchorY);
    });
  });
});
