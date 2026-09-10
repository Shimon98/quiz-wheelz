import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { resolveFarHorizonPlacement } from "../../utils/resolveFarHorizonPlacement";
import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { JungleLayer } from "./JungleLayer";

function texture(width = 1672, height = 941) {
  return new Texture({ source: new TextureSource({ width, height }) });
}

function frame({ width = 520, height = 800, worldOffset = 0 } = {}) {
  const horizonY = 176;
  return {
    width,
    height,
    worldOffset,
    layout: { world: { bottomY: 518 } },
    perspective: {
      centerX: width / 2,
      horizonY,
      depthToY: (t) => horizonY + (518 - horizonY) * t * t,
      roadHalfWidthAt: (t) => 47 + (351 - 47) * t * t,
      viewDistanceAhead: 150,
      distanceAtDepth: (t) => 150 * 47 * (1 - t * t) / (47 + 304 * t * t),
      depthAtDistance: (distance) => Math.sqrt(47 * (150 - distance) / (150 * 47 + 304 * distance)),
    },
  };
}

describe("JungleLayer world-art lifecycle", () => {
  it("draws the legacy world while the far texture is loading", () => {
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: () => new Promise(() => {}),
    });
    const legacy = vi.spyOn(layer, "drawLegacyWorld");

    layer.update(frame());

    expect(layer.farSprite).toBeNull();
    expect(legacy).toHaveBeenCalledTimes(1);
    layer.destroy();
  });

  it("replaces the legacy treelines and rings once the far art loads", async () => {
    const loaded = texture();
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: async () => ({
        status: WORLD_ASSET_STATUS.LOADED,
        texture: loaded,
      }),
    });
    await Promise.resolve();
    const legacy = vi.spyOn(layer, "drawLegacyWorld");

    layer.update(frame());

    expect(legacy).not.toHaveBeenCalled();
    expect(layer.farSprite.texture).toBe(loaded);

    const placement = resolveFarHorizonPlacement({
      centerX: 260,
      frameWidth: 520,
      horizonY: 176,
      textureWidth: 1672,
      textureHeight: 941,
      farConfig: STUDENT_RACE_WORLD_ART.far,
    });
    expect(layer.farSprite.x).toBeCloseTo(placement.x);
    expect(layer.farSprite.y).toBeCloseTo(placement.y);
    expect(layer.farSprite.width).toBeCloseTo(placement.width);
    layer.destroy();
  });

  it("keeps the legacy world on a definitive load failure", async () => {
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: async () => ({ status: WORLD_ASSET_STATUS.FALLBACK }),
    });
    await Promise.resolve();
    const legacy = vi.spyOn(layer, "drawLegacyWorld");

    layer.update(frame());

    expect(layer.farSprite).toBeNull();
    expect(legacy).toHaveBeenCalledTimes(1);
    layer.destroy();
  });

  it("ignores a load that resolves after destroy", async () => {
    let resolveLoad;
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: () => new Promise((resolve) => { resolveLoad = resolve; }),
    });

    layer.destroy();
    resolveLoad({ status: WORLD_ASSET_STATUS.LOADED, texture: texture() });
    await Promise.resolve();

    expect(layer.farSprite).toBeNull();
  });
});

function backdropRects(layer) {
  return layer.backdropGraphics.context.instructions
    .filter((instruction) => instruction.action === "fill")
    .map((instruction) => {
      const rect = instruction.data.path.instructions.find(
        (pathInstruction) => pathInstruction.action === "rect",
      );
      const [x, y, width, height] = rect.data;
      return { x, y, width, height, color: instruction.data.style.color };
    });
}

describe("JungleLayer static backdrop", () => {
  it("paints sky and ground gradients from config, rebuilt only per canvas size", () => {
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: () => new Promise(() => {}),
    });
    const { sky, ground } = STUDENT_RACE_WORLD_ART;

    layer.update(frame());
    const rects = backdropRects(layer);
    const skyRects = rects.filter((rect) => rect.y < 176);
    const groundRects = rects.filter((rect) => rect.y >= 176);

    expect(rects[0]).toMatchObject({ x: 0, y: 0, width: 520, color: sky.topColor });
    expect(skyRects.at(-1).color).toBe(sky.horizonColor);
    expect(groundRects[0]).toMatchObject({ y: 176, color: ground.topColor });
    const lowest = groundRects.at(-1);
    expect(lowest.color).toBe(ground.bottomColor);
    expect(lowest.y + lowest.height).toBeGreaterThanOrEqual(800);

    layer.update(frame());
    expect(backdropRects(layer)).toHaveLength(rects.length);

    layer.update(frame({ width: 360, height: 640 }));
    expect(backdropRects(layer)[0].width).toBe(360);
    layer.destroy();
  });
});

describe("JungleLayer projected ground", () => {
  it("draws the ground plane between the backdrop and the far sprite, scrolled in worldOffset lockstep", async () => {
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: async () => ({
        status: WORLD_ASSET_STATUS.LOADED,
        texture: texture(),
      }),
    });
    await Promise.resolve();

    layer.update(frame());

    const children = layer.container.children;
    expect(children.indexOf(layer.groundContainer)).toBeGreaterThan(
      children.indexOf(layer.backdropGraphics),
    );
    expect(children.indexOf(layer.mistGraphics)).toBeGreaterThan(
      children.indexOf(layer.groundContainer),
    );
    expect(children.indexOf(layer.groundContainer)).toBeLessThan(
      children.indexOf(layer.farSprite),
    );
    expect(layer.groundStrip.mesh.parent).toBe(layer.groundContainer);

    const uvs = () => layer.groundStrip.mesh.geometry.getBuffer("aUV").data;
    const vAtZero = uvs()[1];
    layer.update(
      frame({ worldOffset: STUDENT_RACE_WORLD_ART.ground.tileWorldLength / 2 }),
    );
    expect(uvs()[1]).toBeCloseTo(vAtZero + 0.5);
    layer.destroy();
  });

  it("keeps the gradient ground when the ground texture never loads", () => {
    const layer = new JungleLayer(new Container(), {
      loadWorldTexture: () => new Promise(() => {}),
    });

    layer.update(frame());

    expect(layer.groundStrip).toBeNull();
    expect(layer.groundContainer.children).toHaveLength(0);
    layer.destroy();
  });
});
