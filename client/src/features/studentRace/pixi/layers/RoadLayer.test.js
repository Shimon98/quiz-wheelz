import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { RoadLayer } from "./RoadLayer";

const { road, viewDepthZones } = STUDENT_RACE_VISUAL_CONFIG;

function texture(width = 1024, height = 1536) {
  return new Texture({ source: new TextureSource({ width, height }) });
}

function frame(worldOffset = 0, size = { width: 520, height: 800 }) {
  const horizonY = 176;
  const worldBottomY = 518;
  return {
    ...size,
    worldOffset,
    layout: { world: { bottomY: worldBottomY } },
    perspective: {
      centerX: size.width / 2,
      widthUnit: size.width,
      horizonY,
      depthToY: (t) => horizonY + (worldBottomY - horizonY) * t * t,
      roadHalfWidthAt: (t) => 47 + (351 - 47) * t * t,
      viewDistanceAhead: 150,
      distanceAtDepth: (t) => 150 * 47 * (1 - t * t) / (47 + 304 * t * t),
      depthAtDistance: (distance) => Math.sqrt(47 * (150 - distance) / (150 * 47 + 304 * distance)),
    },
  };
}

function createLayer(loadWorldTexture) {
  return new RoadLayer(new Container(), { road, viewDepthZones, loadWorldTexture });
}

function meshV(layer, row = 0) {
  return layer.mesh.geometry.getBuffer("aUV").data[row * 4 + 1];
}

describe("RoadLayer world-art lifecycle", () => {
  it("draws the Graphics fallback while the texture is loading", () => {
    const layer = createLayer(() => new Promise(() => {}));

    layer.update(frame());

    expect(layer.mesh).toBeNull();
    expect(layer.roadTexture).toBeNull();
    layer.destroy();
  });

  it("switches to the textured mesh after a successful load", async () => {
    const loaded = texture();
    const layer = createLayer(async () => ({
      status: WORLD_ASSET_STATUS.LOADED,
      texture: loaded,
    }));
    await Promise.resolve();

    layer.update(frame());

    expect(layer.mesh).not.toBeNull();
    expect(layer.mesh.texture).toBe(loaded);
    expect(layer.mesh.parent).not.toBeNull();
    layer.destroy();
  });

  it("scrolls the texture v phase from worldOffset without an independent clock", async () => {
    const layer = createLayer(async () => ({
      status: WORLD_ASSET_STATUS.LOADED,
      texture: texture(),
    }));
    await Promise.resolve();

    layer.update(frame(0));
    const vAtZero = meshV(layer);
    layer.update(frame(0));
    expect(meshV(layer)).toBe(vAtZero);

    const half = STUDENT_RACE_WORLD_ART.road.tileWorldLength / 2;
    layer.update(frame(half));
    expect(meshV(layer)).toBeCloseTo(vAtZero + 0.5);

    layer.update(frame(STUDENT_RACE_WORLD_ART.road.tileWorldLength));
    expect(meshV(layer)).toBeCloseTo(vAtZero);
    layer.destroy();
  });

  it("rebuilds mesh positions when the viewport changes", async () => {
    const layer = createLayer(async () => ({
      status: WORLD_ASSET_STATUS.LOADED,
      texture: texture(),
    }));
    await Promise.resolve();

    layer.update(frame());
    const wide = layer.mesh.geometry.getBuffer("aPosition").data[0];
    layer.update(frame(0, { width: 360, height: 640 }));

    expect(layer.mesh.geometry.getBuffer("aPosition").data[0]).not.toBe(wide);
    layer.destroy();
  });

  it("draws the horizon haze in both render paths, above the mesh", async () => {
    const layer = createLayer(async () => ({
      status: WORLD_ASSET_STATUS.LOADED,
      texture: texture(),
    }));
    const haze = vi.spyOn(layer, "drawHorizonHaze");

    layer.update(frame());
    expect(haze).toHaveBeenCalledTimes(1);
    expect(layer.mesh).toBeNull();

    await Promise.resolve();
    layer.update(frame());
    expect(haze).toHaveBeenCalledTimes(2);

    const children = layer.container.children;
    expect(layer.mesh.parent).toBe(layer.meshContainer);
    expect(children.indexOf(layer.hazeGraphics)).toBeGreaterThan(
      children.indexOf(layer.meshContainer),
    );
    const hazeShapes = layer.hazeGraphics.context.instructions.map(
      (instruction) => instruction.data.path.instructions.at(-1).action,
    );
    expect(hazeShapes.length).toBeGreaterThan(0);
    expect(new Set(hazeShapes)).toEqual(new Set(["ellipse"]));
    layer.destroy();
  });

  it("keeps the fallback on a definitive load failure", async () => {
    const layer = createLayer(async () => ({
      status: WORLD_ASSET_STATUS.FALLBACK,
    }));
    await Promise.resolve();

    layer.update(frame());

    expect(layer.mesh).toBeNull();
    layer.destroy();
  });

  it("ignores a load that resolves after destroy", async () => {
    let resolveLoad;
    const layer = createLayer(
      () => new Promise((resolve) => { resolveLoad = resolve; }),
    );

    layer.destroy();
    resolveLoad({ status: WORLD_ASSET_STATUS.LOADED, texture: texture() });
    await Promise.resolve();

    expect(layer.roadTexture).toBeNull();
  });
});
