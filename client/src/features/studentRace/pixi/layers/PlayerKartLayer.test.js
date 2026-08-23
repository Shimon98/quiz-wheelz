import { Container } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import {
  VEHICLE_ASSET_FALLBACK_REASON,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";
import { PlayerKartLayer } from "./PlayerKartLayer";

// C1-06C-PREP lifecycle — synthetic loader results only; no image files,
// no Sprite creation, no real Pixi Assets calls.

function loadedResult(vehicleAssetKey, textures) {
  return {
    status: VEHICLE_ASSET_STATUS.LOADED,
    vehicleAssetKey,
    definition: { idleFrames: ["frame.webp"], anchorX: 0.5, anchorY: 0.9, baseScale: 1 },
    textures,
  };
}

function fallbackResult(vehicleAssetKey, reason) {
  return { status: VEHICLE_ASSET_STATUS.FALLBACK, vehicleAssetKey, reason };
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function createLayer(loadVehicleAssets) {
  return new PlayerKartLayer(new Container(), { loadVehicleAssets });
}

describe("PlayerKartLayer vehicle asset lifecycle", () => {
  it.each([[null], [undefined], [""]])(
    "does not call the loader for an invalid key: %s",
    (key) => {
      const loadVehicleAssets = vi.fn();
      const layer = createLayer(loadVehicleAssets);

      layer.setVehicleAssetKey(key);

      expect(loadVehicleAssets).not.toHaveBeenCalled();
      expect(layer.loadedVehicleArt).toBeNull();
      layer.destroy();
    },
  );

  it("loads the same key only once", async () => {
    const texture = { id: "green" };
    const loadVehicleAssets = vi.fn(async (key) =>
      loadedResult(key, [texture]),
    );
    const layer = createLayer(loadVehicleAssets);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();
    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    expect(loadVehicleAssets).toHaveBeenCalledTimes(1);
    expect(layer.loadedVehicleArt.texture).toBe(texture);
    layer.destroy();
  });

  it("ignores a stale result that resolves after a newer key", async () => {
    const green = deferred();
    const red = deferred();
    const pending = { TOY_CAR_GREEN: green, TOY_CAR_RED: red };
    const loadVehicleAssets = vi.fn((key) => pending[key].promise);
    const layer = createLayer(loadVehicleAssets);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.setVehicleAssetKey("TOY_CAR_RED");

    const redTexture = { id: "red" };
    red.resolve(loadedResult("TOY_CAR_RED", [redTexture]));
    await Promise.resolve();
    green.resolve(loadedResult("TOY_CAR_GREEN", [{ id: "green" }]));
    await Promise.resolve();

    expect(layer.loadedVehicleArt.texture).toBe(redTexture);
    layer.destroy();
  });

  it("does not mutate a destroyed layer when a pending load resolves", async () => {
    const green = deferred();
    const layer = createLayer(() => green.promise);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.destroy();

    green.resolve(loadedResult("TOY_CAR_GREEN", [{ id: "green" }]));
    await Promise.resolve();

    expect(layer.loadedVehicleArt).toBeNull();
  });

  it.each([
    [VEHICLE_ASSET_FALLBACK_REASON.UNKNOWN_KEY],
    [VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED],
  ])(
    "a fallback result (%s) clears prepared art and keeps the Graphics placeholder",
    async (reason) => {
      const loadVehicleAssets = vi.fn(async (key) =>
        key === "TOY_CAR_GREEN"
          ? loadedResult(key, [{ id: "green" }])
          : fallbackResult(key, reason),
      );
      const layer = createLayer(loadVehicleAssets);

      layer.setVehicleAssetKey("TOY_CAR_GREEN");
      await Promise.resolve();
      expect(layer.loadedVehicleArt).not.toBeNull();

      layer.setVehicleAssetKey("TOY_CAR_MISSING");
      await Promise.resolve();

      expect(layer.loadedVehicleArt).toBeNull();
      expect(layer.kart.destroyed).toBe(false);
      expect(layer.kart.parent).toBe(layer.root);
      layer.destroy();
    },
  );

  it("prepares only the first texture from a multi-frame result", async () => {
    const frames = [{ id: "t1" }, { id: "t2" }, { id: "t3" }, { id: "t4" }];
    const layer = createLayer(async (key) => loadedResult(key, frames));

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    expect(layer.loadedVehicleArt.texture).toBe(frames[0]);
    layer.destroy();
  });
});
