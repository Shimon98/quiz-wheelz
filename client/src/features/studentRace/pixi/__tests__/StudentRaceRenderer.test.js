import { Container, Texture, TextureSource } from "pixi.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { StudentRaceRenderer } from "../StudentRaceRenderer";
import { mapRaceStateToRuntime } from "../../runtime/mapRaceStateToRuntime.js";
import { raceOpponent, raceResponse } from "../../runtime/studentRaceTestFixtures.js";

const pendingLoads = vi.hoisted(() => []);

vi.mock("../assets/studentRaceWorldAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceWorldTexture: (assetUrl) => new Promise((resolve) => {
    pendingLoads.push({ assetUrl, resolve });
  }),
}));

vi.mock("../assets/studentRaceVehicleAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceVehicleAssets: async (vehicleAssetKey) => ({ status: "fallback", vehicleAssetKey }),
}));

function createRenderer() {
  const app = {
    screen: { width: 520, height: 800 },
    stage: new Container(),
    ticker: { add: vi.fn(), remove: vi.fn() },
  };
  return new StudentRaceRenderer(app);
}

function loadedTexture() {
  return {
    status: WORLD_ASSET_STATUS.LOADED,
    texture: new Texture({ source: new TextureSource({ width: 400, height: 512 }) }),
  };
}

function tick(renderer) {
  renderer.tick({ deltaMS: 16, elapsedMS: 16 });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  pendingLoads.length = 0;
});

describe("StudentRaceRenderer initial world readiness", () => {
  it("shows one static loading surface without drawing obsolete fallback scenery", () => {
    const renderer = createRenderer();
    const jungleFallback = vi.spyOn(renderer.jungleLayer, "drawLegacyWorld");
    const roadFallback = vi.spyOn(renderer.roadLayer, "drawFallbackRoad");

    tick(renderer);
    renderer.resize(360, 640);
    tick(renderer);

    expect(renderer.loadingSurface.visible).toBe(true);
    expect(renderer.sceneContainers.every((container) => !container.visible)).toBe(true);
    expect(jungleFallback).not.toHaveBeenCalled();
    expect(roadFallback).not.toHaveBeenCalled();
    const fill = renderer.loadingSurface.context.instructions[0];
    expect(fill.data.style.color).toBe(STUDENT_RACE_WORLD_ART.sky.topColor);
    expect(fill.data.path.instructions[0].data.slice(0, 4)).toEqual([0, 0, 360, 640]);
    renderer.destroy();
  });

  it("waits for the last scenery texture and reveals only after positioning a complete frame", async () => {
    const renderer = createRenderer();
    const lastLoad = pendingLoads.at(-1);
    pendingLoads.slice(0, -1).forEach(({ resolve }) => resolve(loadedTexture()));
    await flush();
    tick(renderer);

    expect(renderer.worldReady).toBe(false);
    expect(renderer.loadingSurface.visible).toBe(true);
    expect(renderer.sceneContainers.every((container) => !container.visible)).toBe(true);

    lastLoad.resolve(loadedTexture());
    await renderer.ready;
    expect(renderer.sceneContainers.every((container) => !container.visible)).toBe(true);

    tick(renderer);

    expect(renderer.loadingSurface.visible).toBe(false);
    expect(renderer.sceneContainers.every((container) => container.visible)).toBe(true);
    expect(renderer.roadLayer.mesh).not.toBeNull();
    expect(renderer.jungleLayer.groundStrip.mesh).not.toBeNull();
    expect(renderer.jungleLayer.farSprite.width).toBeGreaterThan(0);
    expect(renderer.sceneryLayer.items.some(({ sprite }) => sprite.visible)).toBe(true);
    renderer.destroy();
  });

  it("reveals the existing fallback world after definitive asset failures", async () => {
    const renderer = createRenderer();
    const jungleFallback = vi.spyOn(renderer.jungleLayer, "drawLegacyWorld");
    const roadFallback = vi.spyOn(renderer.roadLayer, "drawFallbackRoad");
    pendingLoads.forEach(({ resolve }) => resolve({ status: WORLD_ASSET_STATUS.FALLBACK }));
    await renderer.ready;

    tick(renderer);

    expect(renderer.loadingSurface.visible).toBe(false);
    expect(jungleFallback).toHaveBeenCalledOnce();
    expect(roadFallback).toHaveBeenCalledOnce();
    expect(renderer.sceneContainers.every((container) => container.visible)).toBe(true);
    renderer.destroy();
  });

  it("does not reveal or attach late assets after destruction", async () => {
    const renderer = createRenderer();
    renderer.destroy();
    pendingLoads.forEach(({ resolve }) => resolve(loadedTexture()));
    await renderer.ready;

    expect(renderer.worldReady).toBe(false);
    expect(renderer.app.stage.children).toHaveLength(0);
    expect(renderer.loadingSurface.destroyed).toBe(true);
    expect(renderer.jungleLayer.farSprite).toBeNull();
    expect(renderer.sceneryLayer.items).toBeNull();
    expect(renderer.app.ticker.remove).toHaveBeenCalledWith(renderer.tick);
  });
});

describe("StudentRaceRenderer depth order", () => {
  it("draws the local kart inside the sorted world between nearer and farther opponents", async () => {
    const renderer = createRenderer();
    pendingLoads.forEach(({ resolve }) => resolve(loadedTexture()));
    await renderer.ready;
    renderer.updateRuntimeState(mapRaceStateToRuntime(raceResponse({
      position: 200, positionAtEpochMs: 10000, movementUnitsPerSecond: 0,
      opponents: [
        raceOpponent({ racePlayerId: 2, laneNumber: 2, position: 199.5, movementUnitsPerSecond: 0, positionAtEpochMs: 10000 }),
        raceOpponent({ racePlayerId: 3, laneNumber: 3, position: 220, movementUnitsPerSecond: 0, positionAtEpochMs: 10000 }),
      ],
    })));
    await flush();
    tick(renderer);
    tick(renderer);

    const world = renderer.worldContainer;
    world.sortChildren();
    const player = renderer.playerKartLayer.root;
    const nearer = renderer.opponentLayer.byPlayerId.get(2).vehicleVisual.root;
    const farther = renderer.opponentLayer.byPlayerId.get(3).vehicleVisual.root;
    expect(player.parent).toBe(world);
    expect(renderer.sceneContainers).toHaveLength(3);
    expect(player.zIndex).toBeCloseTo(renderer.raceObjectGeometry.playerDepth, 9);
    expect(nearer.zIndex).toBeGreaterThan(player.zIndex);
    expect(farther.zIndex).toBeLessThan(player.zIndex);
    expect(world.children.indexOf(nearer)).toBeGreaterThan(world.children.indexOf(player));
    expect(world.children.indexOf(farther)).toBeLessThan(world.children.indexOf(player));
    expect(world.children.indexOf(renderer.roadLayer.mesh)).toBeLessThan(world.children.indexOf(farther));
    renderer.destroy();
  });
});
