import { Container, Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import { PlayerKartLayer } from "../PlayerKartLayer";

const { poseHoldMs } = STUDENT_RACE_ANIMATION_CONFIG.turboSuccess;
const { poseFadeMs, posePreloadDelayMs } = STUDENT_RACE_ANIMATION_CONFIG.kartPoses;
const texture = () => new Texture({ source: new TextureSource({ width: 768, height: 768 }) });
const IDLE = texture();
const TURBO = texture();
const SAFE = texture();
const DEFINITION = Object.freeze({
  ...STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN,
  poses: Object.freeze({ SAFE_RUN: "safe.webp", TURBO_TRIAL: "turbo.webp" }),
});
const POSES = { "safe.webp": SAFE, "turbo.webp": TURBO };
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

async function layerWith(options = {}) {
  const layer = new PlayerKartLayer(new Container(), {
    loadVehicleAssets: async () => ({ status: "loaded", definition: DEFINITION, textures: [IDLE] }),
    loadPoseTexture: async (url) => POSES[url],
    ...options,
  });
  layer.setVehicleAssetKey("TOY_CAR_GREEN");
  await Promise.resolve();
  return layer;
}

function frame(mode, { deltaMs = 16, reducedMotion = false } = {}) {
  return {
    deltaMs,
    visualSpeed: 1,
    layout: { playerKart: { maxWidth: 170, anchorX: 260, anchorY: 420 } },
    runtimeState: { gameplay: { mode }, visual: { reducedMotion } },
  };
}

function run(layer, mode, ms, options) {
  for (let elapsed = 0; elapsed < ms; elapsed += 16) layer.update(frame(mode, options));
}

async function inTurboPose() {
  const layer = await layerWith();
  play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);
  layer.update(frame("NORMAL"));
  await flush();
  run(layer, "NORMAL", poseFadeMs + 50);
  expect(layer.artSprite.texture).toBe(TURBO);
  return layer;
}

const play = (layer, type) => layer.playMoments({ id: 1, moments: [{ type, id: `m-${type}` }] });

afterEach(() => { vi.useRealTimers(); });

describe("PlayerKartLayer Turbo success choreography", () => {
  it.each(["TURBO_TRIAL", "NORMAL", "CHALLENGE_CHOICE"])("never launches without an accepted success in %s, even with preloaded art", async (mode) => {
    const layer = await layerWith();
    layer.pose.preload();
    await flush();
    run(layer, mode, 2000);
    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.poseOverlay.visible).toBe(false);
    expect(layer.thrusters.container.visible).toBe(false);
    expect(layer.poseHold).toBeNull();
    layer.destroy();
  });

  it("drops a late success pose once its presentation window is over", async () => {
    let resolve;
    const pending = new Promise(ok => { resolve = ok; });
    const layer = await layerWith({ loadPoseTexture: () => pending });
    play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    run(layer, "NORMAL", poseHoldMs + poseFadeMs + 100);
    resolve(TURBO);
    await flush();
    run(layer, "NORMAL", 500);
    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.thrusters.container.visible).toBe(false);
    layer.destroy();
  });

  it("a normal correct answer is not a Turbo win", async () => {
    const layer = await layerWith();
    play(layer, STUDENT_RACE_EFFECT.CORRECT);
    run(layer, "TURBO_TRIAL", 500);
    expect(layer.poseHold).toBeNull();
    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.thrusters.container.visible).toBe(false);
    layer.destroy();
  });

  it("a failure never enters the launch pose or starts fire", async () => {
    const layer = await layerWith();
    play(layer, STUDENT_RACE_EFFECT.TURBO_FAILURE);
    run(layer, "NORMAL", 400);
    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.thrusters.burst.nozzles.every(n => !n.flame.visible)).toBe(true);
    layer.destroy();
  });

  it("crossfades into a pose instead of swapping it at once", async () => {
    const layer = await layerWith();
    play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    layer.update(frame("NORMAL"));
    await flush();
    layer.update(frame("NORMAL"));

    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.poseOverlay.visible).toBe(true);
    expect(layer.poseOverlay.texture).toBe(TURBO);
    layer.destroy();
  });

  it("holds the Turbo pose and glow after a success while the server is already NORMAL, then fades back", async () => {
    const layer = await inTurboPose();

    play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);
    run(layer, "NORMAL", poseHoldMs - 100);
    expect(layer.artSprite.texture).toBe(TURBO);
    expect(layer.thrusters.palette).toBeNull();

    run(layer, "NORMAL", 100 + poseFadeMs + 50);
    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });

  it.each([
    ["the finish", (layer) => { play(layer, STUDENT_RACE_EFFECT.FINISH); run(layer, "NORMAL", poseFadeMs + 50); }],
    ["a new challenge offer", (layer) => run(layer, "CHALLENGE_CHOICE", poseFadeMs + 50)],
  ])("lets %s cut the hold short", async (_, next) => {
    const layer = await inTurboPose();
    play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);

    next(layer);

    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });

  it("returns from Turbo in 160 ms while Safe retains its existing fade duration", async () => {
    const layer = await inTurboPose();
    layer.poseHold = null;
    layer.update(frame("NORMAL", { deltaMs: 80 }));
    expect(layer.poseOverlay.visible).toBe(true);
    expect(layer.fade.transitionMs).toBe(160);
    layer.update(frame("NORMAL", { deltaMs: 80 }));
    expect(layer.artSprite.texture).toBe(IDLE);
    expect(layer.poseOverlay.visible).toBe(false);
    layer.update(frame("SAFE_RUN"));
    await flush();
    layer.update(frame("SAFE_RUN"));
    expect(layer.fade.transitionMs).toBe(poseFadeMs);
    layer.destroy();
  });

  it("does not hold or fade under reduced motion", async () => {
    const layer = await inTurboPose();
    play(layer, STUDENT_RACE_EFFECT.TURBO_SUCCESS);

    layer.update(frame("NORMAL", { reducedMotion: true }));

    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });

  it("preloads and prepares the player's poses shortly after the kart art appears", async () => {
    vi.useFakeTimers();
    const loadPoseTexture = vi.fn(async (url) => POSES[url]);
    const prepareTexture = vi.fn();
    const layer = await layerWith({ loadPoseTexture, prepareTexture });
    expect(loadPoseTexture).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(posePreloadDelayMs + 10);

    expect(loadPoseTexture.mock.calls.map(([url]) => url).sort()).toEqual(["safe.webp", "turbo.webp"]);
    expect(prepareTexture).toHaveBeenCalledTimes(2);
    layer.destroy();
  });

  it("warms the pose blend up in the same quiet moment, so the first win does not compile it", async () => {
    vi.useFakeTimers();
    const layer = await layerWith();
    layer.update(frame("NORMAL"));
    expect(layer.fade.filter.enabled).toBe(false);

    await vi.advanceTimersByTimeAsync(posePreloadDelayMs + 10);
    expect(layer.fade.filter.enabled).toBe(true);
    layer.update(frame("NORMAL"));
    layer.update(frame("NORMAL"));

    expect(layer.fade.filter.enabled).toBe(false);
    expect(layer.artSprite.texture).toBe(IDLE);
    layer.destroy();
  });
});
