import { Container, Texture, TextureSource } from "pixi.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WORLD_ASSET_STATUS } from "../assets/studentRaceWorldAssets";
import { StudentRaceRenderer } from "../StudentRaceRenderer";
import { mapRaceStateToRuntime } from "../../runtime/mapRaceStateToRuntime.js";
import { raceResponse } from "../../runtime/studentRaceTestFixtures.js";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";

const pendingLoads = vi.hoisted(() => []);

vi.mock("../assets/studentRaceWorldAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceWorldTexture: (assetUrl) => new Promise((resolve) => { pendingLoads.push({ assetUrl, resolve }); }),
}));

vi.mock("../assets/studentRaceVehicleAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceVehicleAssets: async (vehicleAssetKey) => ({ status: "fallback", vehicleAssetKey }),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function readyRenderer(reducedMotion = false) {
  const app = { screen: { width: 520, height: 800 }, stage: new Container(), ticker: { add: vi.fn(), remove: vi.fn() } };
  const renderer = new StudentRaceRenderer(app);
  pendingLoads.forEach(({ resolve }) => resolve({
    status: WORLD_ASSET_STATUS.LOADED, texture: new Texture({ source: new TextureSource({ width: 400, height: 512 }) }),
  }));
  await flush();
  await renderer.ready;
  const state = mapRaceStateToRuntime(raceResponse());
  renderer.updateRuntimeState({ ...state, visual: { ...state.visual, reducedMotion } });
  return renderer;
}

const tick = (renderer, ms = 16) => renderer.tick({ deltaMS: ms, elapsedMS: ms });
const turboSuccess = { id: 1, moments: [{ type: STUDENT_RACE_EFFECT.TURBO_SUCCESS, id: "challenge-5" }] };

beforeEach(() => { pendingLoads.length = 0; });

describe("StudentRaceRenderer Turbo success", () => {
  it.each([false, true])("celebrates without changing world motion or zoom (reduced motion %s)", async (reduced) => {
    const renderer = await readyRenderer(reduced);
    const control = await readyRenderer(reduced);
    const next = { ...renderer.runtimeState, visual: { ...renderer.runtimeState.visual,
      targetPosition: renderer.runtimeState.visual.targetPosition + 80 } };
    renderer.updateRuntimeState(next);
    control.updateRuntimeState(next);
    const play = vi.spyOn(renderer.playerKartLayer, "playMoments");
    renderer.playMoments(turboSuccess);
    expect(play).toHaveBeenCalledWith(turboSuccess);
    for (let frame = 0; frame < 180; frame += 1) {
      tick(renderer);
      tick(control);
      expect(renderer.motion.advance(0)).toEqual(control.motion.advance(0));
      expect(renderer.app.stage.scale.x).toBe(1);
      expect(renderer.app.stage.pivot.x).toBe(0);
      expect(renderer.app.stage.position.x).toBe(0);
    }
    renderer.destroy();
    control.destroy();
  });
});
