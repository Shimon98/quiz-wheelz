import { Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KartPoseArt } from "../KartPoseArt";

const texture = () => new Texture({ source: new TextureSource({ width: 768, height: 768 }) });
const IDLE = texture();
const DEFINITION = Object.freeze({ poses: Object.freeze({ SAFE_RUN: "safe.webp", TURBO_TRIAL: "turbo.webp" }) });
const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

afterEach(() => vi.restoreAllMocks());

describe("KartPoseArt preload and recovery", () => {
  it("preloads the player's two poses once and prepares each for the GPU", async () => {
    const loaded = { "safe.webp": texture(), "turbo.webp": texture() };
    const loadTexture = vi.fn(async (url) => loaded[url]);
    const prepareTexture = vi.fn();
    const pose = new KartPoseArt({ loadTexture, prepareTexture });
    pose.attach(DEFINITION, IDLE);

    pose.preload();
    pose.preload();
    await flush();

    expect(loadTexture.mock.calls.map(([url]) => url).sort()).toEqual(["safe.webp", "turbo.webp"]);
    expect(prepareTexture).toHaveBeenCalledWith(loaded["safe.webp"]);
    expect(prepareTexture).toHaveBeenCalledWith(loaded["turbo.webp"]);
    expect(pose.textureFor("SAFE_RUN")).toBe(loaded["safe.webp"]);
  });

  it("retries a failed pose on a later mode entry, at most twice and never within the retry gap", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let now = 0;
    const loadTexture = vi.fn(() => Promise.reject(new Error("offline")));
    const pose = new KartPoseArt({ loadTexture, now: () => now });
    pose.attach(DEFINITION, IDLE);

    pose.textureFor("SAFE_RUN");
    await flush();
    pose.textureFor("SAFE_RUN");
    expect(loadTexture).toHaveBeenCalledTimes(1);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      now += 6000;
      pose.textureFor("SAFE_RUN");
      await flush();
    }

    expect(loadTexture).toHaveBeenCalledTimes(3);
    expect(pose.textureFor("SAFE_RUN")).toBe(IDLE);
  });

  it("does not retry while the device is offline", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    let now = 0;
    const loadTexture = vi.fn(() => Promise.reject(new Error("offline")));
    const pose = new KartPoseArt({ loadTexture, now: () => now });
    pose.attach(DEFINITION, IDLE);

    pose.textureFor("TURBO_TRIAL");
    await flush();
    now += 6000;
    pose.textureFor("TURBO_TRIAL");

    expect(loadTexture).toHaveBeenCalledTimes(1);
  });
});
