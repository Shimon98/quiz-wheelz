import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { MidBaseLayer } from "./MidBaseLayer";

function texture() {
  return new Texture({ source: new TextureSource({ width: 2024, height: 768 }) });
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
      distanceAtDepth: (t) => 150 * 47 * (1 - t * t) / (47 + 304 * t * t),
    },
  };
}

async function loadedLayer() {
  const layer = new MidBaseLayer(new Container(), {
    enabled: true,
    loadWorldTexture: async () => ({
      status: WORLD_ASSET_STATUS.LOADED,
      texture: texture(),
    }),
  });
  await Promise.resolve();
  return layer;
}

function stripU(strip) {
  return strip.mesh.geometry.getBuffer("aUV").data[0];
}

describe("MidBaseLayer", () => {
  it("draws nothing until the texture loads", () => {
    const layer = new MidBaseLayer(new Container(), {
      enabled: true,
      loadWorldTexture: () => new Promise(() => {}),
    });

    layer.update(frame());

    expect(layer.strips).toBeNull();
    expect(layer.container.children).toHaveLength(0);
    layer.destroy();
  });

  it("builds two projected strips whose feet sit just inside the road edges", async () => {
    const layer = await loadedLayer();
    const { footInset, heightRatio } = STUDENT_RACE_WORLD_ART.midBase;

    layer.update(frame());

    const [left, right] = layer.strips;
    const footIndex = (left.data.vertexColumns - 1) * 2;
    const leftPositions = left.mesh.geometry.getBuffer("aPosition").data;
    const rightPositions = right.mesh.geometry.getBuffer("aPosition").data;
    expect(leftPositions[footIndex]).toBeCloseTo(260 - 47 * (1 - footInset));
    expect(leftPositions[footIndex + 1]).toBeCloseTo(176);
    expect(leftPositions[1]).toBeCloseTo(176 - 47 * heightRatio);
    expect(rightPositions[footIndex]).toBeCloseTo(260 + 47 * (1 - footInset));
    expect(layer.container.children).toHaveLength(2);
    layer.destroy();
  });

  it("scrolls both strips from worldOffset in lockstep, the right one mirrored", async () => {
    const layer = await loadedLayer();
    const { tileWorldLength } = STUDENT_RACE_WORLD_ART.midBase;

    layer.update(frame(0));
    const [left, right] = layer.strips;
    const leftAtZero = stripU(left);
    const rightAtZero = stripU(right);

    layer.update(frame(tileWorldLength / 2));
    expect(stripU(left)).toBeCloseTo(leftAtZero + 0.5);
    expect(stripU(right)).toBeCloseTo(rightAtZero - 0.5);
    layer.destroy();
  });

  it("rebuilds strip positions when the viewport changes", async () => {
    const layer = await loadedLayer();

    layer.update(frame());
    const wide = layer.strips[0].mesh.geometry.getBuffer("aPosition").data[0];
    layer.update(frame(0, { width: 360, height: 640 }));

    expect(layer.strips[0].mesh.geometry.getBuffer("aPosition").data[0]).not.toBe(wide);
    expect(layer.container.children).toHaveLength(2);
    layer.destroy();
  });

  it("ignores a load that resolves after destroy", async () => {
    let resolveLoad;
    const layer = new MidBaseLayer(new Container(), {
      enabled: true,
      loadWorldTexture: () => new Promise((resolve) => { resolveLoad = resolve; }),
    });

    layer.destroy();
    resolveLoad({ status: WORLD_ASSET_STATUS.LOADED, texture: texture() });
    await Promise.resolve();

    expect(layer.texture).toBeNull();
  });
});
