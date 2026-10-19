import { Assets, Container, Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RACE_GAMEPLAY_MODES } from "../../../../constants/raceGameplayConstants";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { mapRaceStateToRuntime } from "../../runtime/mapRaceStateToRuntime.js";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { raceResponse } from "../../runtime/studentRaceTestFixtures.js";
import { STUDENT_RACE_EFFECT_ART } from "../assets/studentRaceEffectManifest";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../assets/studentRaceVehicleManifest";
import { StudentRaceRenderer } from "../StudentRaceRenderer";

const art = vi.hoisted(() => ({ idle: null, scenery: null }));

vi.mock("../assets/studentRaceWorldAssets", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, loadStudentRaceWorldTexture: async () => ({ status: actual.WORLD_ASSET_STATUS.LOADED, texture: art.scenery }) };
});

vi.mock("../assets/studentRaceVehicleAssets", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadStudentRaceVehicleAssets: async (vehicleAssetKey) => ({
      status: actual.VEHICLE_ASSET_STATUS.LOADED,
      vehicleAssetKey,
      definition: actual.resolveStudentRaceVehicleAsset(vehicleAssetKey),
      textures: [art.idle],
    }),
  };
});

const { posePreloadDelayMs } = STUDENT_RACE_ANIMATION_CONFIG.kartPoses;
// Images from Assets.load are collectable by Pixi's GPU garbage collector (ImageSource sets the flag).
const collectable = () => new Texture({ source: new TextureSource({ width: 768, height: 768, autoGarbageCollect: true }) });
const GREEN_POSES = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN.poses;

function stubArtLoads(pending = new Set()) {
  art.idle = collectable();
  art.scenery = collectable();
  const loaded = new Map([
    [GREEN_POSES[RACE_GAMEPLAY_MODES.TURBO_TRIAL], collectable()],
    [GREEN_POSES[RACE_GAMEPLAY_MODES.SAFE_RUN], collectable()],
    [STUDENT_RACE_EFFECT_ART.turboExhaust.url, collectable()],
  ]);
  const resolvers = new Map();
  vi.spyOn(Assets, "load").mockImplementation((url) => (pending.has(url)
    ? new Promise((resolve) => resolvers.set(url, () => resolve(loaded.get(url))))
    : Promise.resolve(loaded.get(url))));
  return { loaded, resolvers };
}

async function raceScreen() {
  vi.useFakeTimers();
  const initSource = vi.fn();
  const gc = { maxUnusedTime: 60000, enabled: true };
  const app = {
    screen: { width: 520, height: 800 },
    stage: new Container(),
    ticker: { add: vi.fn(), remove: vi.fn() },
    renderer: { texture: { initSource }, gc },
  };
  const renderer = new StudentRaceRenderer(app);
  await renderer.ready;
  renderer.updateRuntimeState(mapRaceStateToRuntime(raceResponse()));
  await vi.advanceTimersByTimeAsync(posePreloadDelayMs + 10);
  return { app, renderer, initSource, gc };
}

const tick = (renderer) => renderer.tick({ deltaMS: 16, elapsedMS: 16 });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("StudentRaceRenderer GPU residency of the late challenge art", () => {
  it("keeps only the player's two poses and the flame on the GPU, without touching Pixi's collector", async () => {
    const { loaded } = stubArtLoads();
    const { renderer, initSource, gc } = await raceScreen();
    const prepared = [...loaded.values()];

    expect(initSource).toHaveBeenCalledTimes(3);
    expect(initSource.mock.calls.map(([source]) => source)).toEqual(expect.arrayContaining(prepared.map(({ source }) => source)));
    prepared.forEach(({ source }) => expect(source.autoGarbageCollect).toBe(false));
    expect(art.idle.source.autoGarbageCollect).toBe(true);
    expect(art.scenery.source.autoGarbageCollect).toBe(true);
    expect(gc).toEqual({ maxUnusedTime: 60000, enabled: true });
    renderer.destroy();
  });

  it("uploads nothing again when the Turbo win and the Safe run show that art later", async () => {
    stubArtLoads();
    const { renderer, initSource } = await raceScreen();
    const state = renderer.runtimeState;

    renderer.playMoments({ id: 1, moments: [{ type: STUDENT_RACE_EFFECT.TURBO_SUCCESS, id: "challenge-5" }] });
    for (let frame = 0; frame < 120; frame += 1) tick(renderer);
    renderer.updateRuntimeState({ ...state, gameplay: { ...state.gameplay, mode: RACE_GAMEPLAY_MODES.SAFE_RUN } });
    for (let frame = 0; frame < 60; frame += 1) tick(renderer);

    expect(initSource).toHaveBeenCalledTimes(3);
    renderer.destroy();
  });

  it("neither pins nor uploads a pose that finishes loading after the race screen closed", async () => {
    const turboUrl = GREEN_POSES[RACE_GAMEPLAY_MODES.TURBO_TRIAL];
    const { loaded, resolvers } = stubArtLoads(new Set([turboUrl]));
    const { app, renderer, initSource } = await raceScreen();

    renderer.destroy();
    app.renderer = null;
    resolvers.get(turboUrl)();
    await vi.advanceTimersByTimeAsync(0);

    expect(loaded.get(turboUrl).source.autoGarbageCollect).toBe(true);
    expect(initSource).not.toHaveBeenCalledWith(loaded.get(turboUrl).source);
  });
});
