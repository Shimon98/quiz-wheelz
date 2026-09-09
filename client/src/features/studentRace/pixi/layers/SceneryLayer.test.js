import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_SCENERY } from "../../config/sceneryConfig";
import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { SceneryLayer } from "./SceneryLayer";
import { FinishLineLayer } from "./FinishLineLayer";
import { createRacePerspective } from "../utils/createRacePerspective";

const VIEW_DISTANCE_AHEAD = 150;
const CENTER_X = 260;

function texture(width = 367, height = 512) {
  return new Texture({ source: new TextureSource({ width, height }) });
}

function roadHalfWidthAt(depth) {
  return 20 + 330 * depth * depth;
}

function frame(worldOffset = 0, width = 520) {
  return {
    width,
    height: 800,
    worldOffset,
    layout: { world: { bottomY: 518 } },
    perspective: createRacePerspective({
      width,
      worldBottomY: 518,
      widthUnit: 400,
      camera: {
        horizonYRatio: 176 / 518,
        vanishingPointXRatio: 0.5,
        roadTopWidthRatio: 0.1,
        roadBottomWidthRatio: 1.75,
        roadWidthDepthExponent: 2,
      },
      viewDistanceAhead: VIEW_DISTANCE_AHEAD,
    }),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function loadedLayer(loadWorldTexture = async () => ({
  status: WORLD_ASSET_STATUS.LOADED,
  texture: texture(),
})) {
  const layer = new SceneryLayer(new Container(), { loadWorldTexture });
  await flush();
  return layer;
}

describe("SceneryLayer", () => {
  it("creates nothing before the prop textures resolve", () => {
    const layer = new SceneryLayer(new Container(), {
      loadWorldTexture: () => new Promise(() => {}),
    });

    layer.update(frame());

    expect(layer.items).toBeNull();
    expect(layer.container.children).toHaveLength(0);
    layer.destroy();
  });

  it("creates one base-anchored sprite per placement whose prop art loaded", async () => {
    const { props, placements } = STUDENT_RACE_SCENERY;
    const layer = await loadedLayer(async (assetUrl) =>
      assetUrl === props.ROCK_01.assetUrl
        ? { status: WORLD_ASSET_STATUS.FALLBACK }
        : { status: WORLD_ASSET_STATUS.LOADED, texture: texture() },
    );
    const expected = placements.filter((placement) => placement.prop !== "ROCK_01");

    expect(layer.items).toHaveLength(expected.length);
    expect(layer.container.children).toHaveLength(expected.length);
    expect(layer.container.sortableChildren).toBe(true);
    layer.items.forEach(({ sprite, prop }) => {
      expect(sprite.anchor.x).toBe(0.5);
      expect(sprite.anchor.y).toBe(prop.anchorY ?? 1);
    });
    layer.destroy();
  });

  it("projects visible props outside the road, sized by the road half-width, nearer ones on top", async () => {
    const { props } = STUDENT_RACE_SCENERY;
    const layer = await loadedLayer();

    layer.update(frame(0));

    const shown = layer.items.filter(({ sprite }) => sprite.visible);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(layer.items.length);
    shown.forEach(({ placement, sprite }) => {
      const depth = sprite.zIndex;
      const roadHalfWidth = roadHalfWidthAt(depth);
      const band = STUDENT_RACE_SCENERY.bands[placement.band];
      const innerDistance = Math.abs(sprite.x - CENTER_X) - sprite.width / 2;
      expect(innerDistance).toBeGreaterThanOrEqual(roadHalfWidth * band.minRoadClearance - 0.001);
      expect(Math.sign(sprite.x - CENTER_X)).toBe(placement.side);
      expect(Math.abs(sprite.scale.x)).toBeCloseTo(
        (roadHalfWidth * props[placement.prop].widthPerRoadHalf * placement.scale) / 367,
      );
      expect(Math.sign(sprite.scale.x)).toBe(placement.flip ? -1 : 1);
      expect(sprite.scale.y).toBeCloseTo(Math.abs(sprite.scale.x));
      expect(sprite.tint).toBe(band.tint);
    });
    layer.destroy();
  });

  it("recycles the same placements after a full loop of worldOffset", async () => {
    const layer = await loadedLayer();
    const sprites = layer.items.map(({ sprite }) => sprite);

    const snapshot = (band) =>
      layer.items.filter(({ placement }) => placement.band === band).map(({ sprite }) => sprite.visible ? [
        Math.round(sprite.x * 100),
        Math.round(sprite.y * 100),
      ] : null);

    Object.entries(STUDENT_RACE_SCENERY.bands).forEach(([band, { loopWorldLength }]) => {
      layer.update(frame(1234));
      const before = snapshot(band);
      for (let offset = 0; offset < 30000; offset += 240) {
        layer.update(frame(offset));
      }
      layer.update(frame(1234 + loopWorldLength));
      expect(snapshot(band)).toEqual(before);
    });
    expect(layer.items.map(({ sprite }) => sprite)).toEqual(sprites);
    expect(layer.container.children).toHaveLength(sprites.length);
    layer.destroy();
  });

  it("retains the same visible sprite as its base moves below the question panel", async () => {
    const layer = await loadedLayer();
    const item = layer.items.find(({ placement }) => placement.band === "verge");
    const { placement, sprite } = item;

    layer.update(frame(placement.worldPosition - 0.5, 1280));
    const beforeY = sprite.y;
    expect(sprite.visible).toBe(true);
    expect(sprite.alpha).toBe(1);

    layer.update(frame(placement.worldPosition + 0.5, 1280));

    expect(item.sprite).toBe(sprite);
    expect(sprite.visible).toBe(true);
    expect(sprite.alpha).toBe(1);
    expect(sprite.y).toBeGreaterThan(518);
    expect(sprite.y - beforeY).toBeLessThan(2);
    expect(sprite.zIndex).toBeGreaterThan(1);
    layer.destroy();
  });

  it("ignores a load that resolves after destroy", async () => {
    const pendingLoads = [];
    const layer = new SceneryLayer(new Container(), {
      loadWorldTexture: () => new Promise((resolve) => { pendingLoads.push(resolve); }),
    });

    layer.destroy();
    pendingLoads.forEach((resolveLoad) => {
      resolveLoad({ status: WORLD_ASSET_STATUS.LOADED, texture: texture() });
    });
    await flush();

    expect(layer.items).toBeNull();
  });

  it("interleaves the finish gate with foliage by depth and preserves sibling ownership", async () => {
    const layer = await loadedLayer();
    const finish = new FinishLineLayer(layer.container);
    const state = frame();
    layer.update(state);
    finish.update({ ...state, visualPosition: 900, runtimeState: { totalDistance: 1000 } });
    layer.container.sortChildren();
    const gateIndex = layer.container.getChildIndex(finish.graphics);
    const shown = layer.items.filter(({ sprite }) => sprite.visible);
    const behind = shown.filter(({ sprite }) => sprite.zIndex < finish.graphics.zIndex);
    const ahead = shown.filter(({ sprite }) => sprite.zIndex > finish.graphics.zIndex);

    expect(behind.length).toBeGreaterThan(0);
    expect(ahead.length).toBeGreaterThan(0);
    behind.forEach(({ sprite }) => expect(layer.container.getChildIndex(sprite)).toBeLessThan(gateIndex));
    ahead.forEach(({ sprite }) => expect(layer.container.getChildIndex(sprite)).toBeGreaterThan(gateIndex));
    layer.destroy();
    expect(layer.container.destroyed).toBe(false);
    expect(finish.graphics.destroyed).toBe(false);
    expect(layer.container.children).toEqual([finish.graphics]);
    finish.destroy();
    layer.container.destroy();
  });
});
