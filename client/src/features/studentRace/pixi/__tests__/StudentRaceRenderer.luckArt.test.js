import { Assets, Container, Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudentRaceRenderer } from "../StudentRaceRenderer";

const ORB_URL = "luck-energy-orb.webp";

// The orb slot as it will look once its approved file exists.
vi.mock("../assets/studentRaceEffectManifest", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, LUCK_EFFECT_ART: { ...actual.LUCK_EFFECT_ART, energyOrb: { url: "luck-energy-orb.webp" } } };
});

vi.mock("../assets/studentRaceWorldAssets", async (importOriginal) => {
  const actual = await importOriginal();
  const { Texture: PixiTexture, TextureSource: PixiTextureSource } = await import("pixi.js");
  return {
    ...actual,
    loadStudentRaceWorldTexture: async () => ({
      status: actual.WORLD_ASSET_STATUS.LOADED,
      texture: new PixiTexture({ source: new PixiTextureSource({ width: 400, height: 512 }) }),
    }),
  };
});

vi.mock("../assets/studentRaceVehicleAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceVehicleAssets: async (vehicleAssetKey) => ({ status: "fallback", vehicleAssetKey }),
}));

// Images from Assets.load are collectable by Pixi's GPU garbage collector (ImageSource sets the flag).
const collectable = () => new Texture({ source: new TextureSource({ width: 256, height: 256, autoGarbageCollect: true }) });

describe("StudentRaceRenderer Luck art", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pins approved Luck art with the renderer's GPU pin, without holding the world back", async () => {
    const orb = collectable();
    let finishOrb = null;
    vi.spyOn(Assets, "load").mockImplementation((url) => (url === ORB_URL
      ? new Promise((resolve) => { finishOrb = () => resolve(orb); })
      : Promise.resolve(collectable())));
    const initSource = vi.fn();
    const app = {
      screen: { width: 520, height: 800 },
      stage: new Container(),
      ticker: { add: vi.fn(), remove: vi.fn() },
      renderer: { texture: { initSource } },
    };

    const renderer = new StudentRaceRenderer(app);
    await renderer.ready;

    expect(renderer.worldReady).toBe(true);
    expect(Assets.load).toHaveBeenCalledWith(ORB_URL);
    expect(orb.source.autoGarbageCollect).toBe(true);

    finishOrb();
    await renderer.effectsLayer.artPromise;
    await renderer.playerKartLayer.luckMarks.artPromise;
    const puddle = renderer.playerKartLayer.luckMarks.mud.children.at(-1).texture;

    expect(orb.source.autoGarbageCollect).toBe(false);
    expect(initSource).toHaveBeenCalledWith(orb.source);
    expect(puddle.source.autoGarbageCollect).toBe(false);
    expect(initSource).toHaveBeenCalledWith(puddle.source);
    renderer.destroy();
  });
});
