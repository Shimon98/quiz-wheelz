import { Container, Sprite, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import {
  VEHICLE_ASSET_FALLBACK_REASON,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";
import { PlayerKartLayer } from "./PlayerKartLayer";

// C1-06C lifecycle — synthetic loader results and sized blank textures; no
// image files, no real Pixi Assets calls.

function texture(width = 200, height = 100) {
  return new Texture({ source: new TextureSource({ width, height }) });
}

function loadedResult(vehicleAssetKey, textures, definition = {}) {
  return {
    status: VEHICLE_ASSET_STATUS.LOADED,
    vehicleAssetKey,
    definition: {
      idleFrames: ["frame.webp"],
      anchorX: 0.5,
      anchorY: 0.9,
      baseScale: 1,
      ...definition,
    },
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
      expect(layer.artSprite).toBeNull();
      expect(layer.placeholder.visible).toBe(true);
      layer.destroy();
    },
  );

  it("loads the same key only once", async () => {
    const green = texture();
    const loadVehicleAssets = vi.fn(async (key) =>
      loadedResult(key, [green]),
    );
    const layer = createLayer(loadVehicleAssets);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();
    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    expect(loadVehicleAssets).toHaveBeenCalledTimes(1);
    expect(layer.artSprite.texture).toBe(green);
    layer.destroy();
  });

  it("shows a static sprite fitted to the unit box on load success", async () => {
    const green = texture(400, 300);
    const layer = createLayer(async (key) =>
      loadedResult(key, [green, texture()], { anchorY: 0.96, baseScale: 1.2 }),
    );

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    const sprite = layer.artSprite;
    expect(sprite.constructor).toBe(Sprite);
    expect(sprite.texture).toBe(green);
    expect(sprite.parent).toBe(layer.kart);
    expect(sprite.anchor.x).toBe(0.5);
    expect(sprite.anchor.y).toBe(0.96);
    expect(sprite.width).toBeCloseTo(120);
    expect(sprite.height).toBeCloseTo(90);
    expect(layer.placeholder.visible).toBe(false);
    expect(layer.placeholder.parent).toBe(layer.kart);
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

    const redTexture = texture();
    red.resolve(loadedResult("TOY_CAR_RED", [redTexture]));
    await Promise.resolve();
    green.resolve(loadedResult("TOY_CAR_GREEN", [texture()]));
    await Promise.resolve();

    expect(layer.artSprite.texture).toBe(redTexture);
    expect(layer.kart.children.filter((child) => child instanceof Sprite)).toHaveLength(1);
    layer.destroy();
  });

  it("does not mutate a destroyed layer when a pending load resolves", async () => {
    const green = deferred();
    const layer = createLayer(() => green.promise);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.destroy();

    green.resolve(loadedResult("TOY_CAR_GREEN", [texture()]));
    await Promise.resolve();

    expect(layer.artSprite).toBeNull();
  });

  it.each([
    [VEHICLE_ASSET_FALLBACK_REASON.UNKNOWN_KEY],
    [VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED],
  ])(
    "a fallback result (%s) removes the real sprite and shows the Graphics placeholder",
    async (reason) => {
      const green = texture();
      const loadVehicleAssets = vi.fn(async (key) =>
        key === "TOY_CAR_GREEN"
          ? loadedResult(key, [green])
          : fallbackResult(key, reason),
      );
      const layer = createLayer(loadVehicleAssets);

      layer.setVehicleAssetKey("TOY_CAR_GREEN");
      await Promise.resolve();
      const previousSprite = layer.artSprite;
      expect(previousSprite).not.toBeNull();

      layer.setVehicleAssetKey("TOY_CAR_MISSING");
      await Promise.resolve();

      expect(layer.artSprite).toBeNull();
      expect(previousSprite.destroyed).toBe(true);
      expect(green.destroyed).toBe(false);
      expect(layer.kart.children).toEqual([layer.placeholder]);
      expect(layer.placeholder.visible).toBe(true);
      layer.destroy();
    },
  );

  it("shows only the first texture of a multi-frame result, without playback", async () => {
    const frames = [texture(), texture(), texture(), texture()];
    const layer = createLayer(async (key) => loadedResult(key, frames));

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    expect(layer.artSprite.texture).toBe(frames[0]);
    expect(layer.artSprite.constructor).toBe(Sprite);
    layer.destroy();
  });
});
