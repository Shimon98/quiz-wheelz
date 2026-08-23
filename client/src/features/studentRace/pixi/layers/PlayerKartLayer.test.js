import { Container, Sprite, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import {
  VEHICLE_ASSET_FALLBACK_REASON,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";
import { PlayerKartLayer } from "./PlayerKartLayer";

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

function frameState(deltaMs) {
  return {
    deltaMs,
    visualSpeed: 0,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
  };
}

function visibleArt(layer) {
  return {
    sprite: layer.artSprite != null,
    placeholder: layer.placeholder.visible,
    shadow: layer.shadow.visible,
  };
}

describe("PlayerKartLayer vehicle art lifecycle", () => {
  it("shows nothing before any vehicle key is known", () => {
    const layer = createLayer(vi.fn());

    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: false, shadow: false });
    layer.destroy();
  });

  it.each([[null], [undefined], [""]])(
    "keeps the kart area empty for an invalid key: %s",
    (key) => {
      const loadVehicleAssets = vi.fn();
      const layer = createLayer(loadVehicleAssets);

      layer.setVehicleAssetKey(key);

      expect(loadVehicleAssets).not.toHaveBeenCalled();
      expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: false, shadow: false });
      layer.destroy();
    },
  );

  it("keeps the placeholder hidden while the real art is still loading", () => {
    const green = deferred();
    const layer = createLayer(() => green.promise);

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    layer.update(frameState(16));

    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: false, shadow: false });
    layer.destroy();
  });

  it("reveals only the real sprite on load success, fading in on the frame clock", async () => {
    const green = texture(400, 300);
    const layer = createLayer(async (key) =>
      loadedResult(key, [green], { anchorY: 0.96, baseScale: 1.2 }),
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
    expect(sprite.alpha).toBe(0);
    expect(visibleArt(layer)).toEqual({ sprite: true, placeholder: false, shadow: true });

    layer.update(frameState(60));
    expect(sprite.alpha).toBeCloseTo(0.5);
    layer.update(frameState(60));
    layer.update(frameState(60));
    expect(sprite.alpha).toBe(1);
    layer.destroy();
  });

  it("loads the same key only once", async () => {
    const green = texture();
    const loadVehicleAssets = vi.fn(async (key) => loadedResult(key, [green]));
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

  it("removes the previous vehicle's sprite as soon as another key starts loading", async () => {
    const red = deferred();
    const green = texture();
    const layer = createLayer((key) =>
      key === "TOY_CAR_GREEN"
        ? Promise.resolve(loadedResult(key, [green]))
        : red.promise,
    );

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();
    const greenSprite = layer.artSprite;

    layer.setVehicleAssetKey("TOY_CAR_RED");

    expect(greenSprite.destroyed).toBe(true);
    expect(green.destroyed).toBe(false);
    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: false, shadow: false });
    layer.destroy();
  });

  it("ignores a stale result that resolves after a newer key", async () => {
    const green = deferred();
    const red = deferred();
    const pending = { TOY_CAR_GREEN: green, TOY_CAR_RED: red };
    const layer = createLayer((key) => pending[key].promise);

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
    [VEHICLE_ASSET_FALLBACK_REASON.INVALID_DEFINITION],
    [VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED],
  ])("shows the Graphics placeholder only after a definitive fallback (%s)", async (reason) => {
    const layer = createLayer(async (key) => fallbackResult(key, reason));

    layer.setVehicleAssetKey("TOY_CAR_MISSING");
    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: false, shadow: false });
    await Promise.resolve();

    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: true, shadow: true });
    expect(layer.kart.children).toEqual([layer.placeholder]);
    layer.destroy();
  });

  it("switching from real art to a fallback destroys the sprite but never its texture", async () => {
    const green = texture();
    const layer = createLayer(async (key) =>
      key === "TOY_CAR_GREEN"
        ? loadedResult(key, [green])
        : fallbackResult(key, VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED),
    );

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();
    const previousSprite = layer.artSprite;

    layer.setVehicleAssetKey("TOY_CAR_MISSING");
    await Promise.resolve();

    expect(previousSprite.destroyed).toBe(true);
    expect(green.destroyed).toBe(false);
    expect(visibleArt(layer)).toEqual({ sprite: false, placeholder: true, shadow: true });
    expect(() => layer.update(frameState(16))).not.toThrow();
    layer.destroy();
  });

  it("shows only the first texture of a multi-frame result", async () => {
    const frames = [texture(), texture(), texture(), texture()];
    const layer = createLayer(async (key) => loadedResult(key, frames));

    layer.setVehicleAssetKey("TOY_CAR_GREEN");
    await Promise.resolve();

    expect(layer.artSprite.texture).toBe(frames[0]);
    expect(layer.artSprite.constructor).toBe(Sprite);
    layer.destroy();
  });
});
