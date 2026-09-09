import { Texture, TextureSource } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";

import {
  loadStudentRaceWorldTexture,
  WORLD_ASSET_STATUS,
} from "./studentRaceWorldAssets";

function texture(width = 64, height = 64) {
  return new Texture({ source: new TextureSource({ width, height }) });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("loadStudentRaceWorldTexture", () => {
  it("loads the requested texture once and returns it", async () => {
    const loaded = texture();
    const loadTexture = vi.fn(async () => loaded);

    const result = await loadStudentRaceWorldTexture("world.webp", {
      loadTexture,
    });

    expect(result.status).toBe(WORLD_ASSET_STATUS.LOADED);
    expect(result.texture).toBe(loaded);
    expect(loadTexture).toHaveBeenCalledTimes(1);
    expect(loadTexture).toHaveBeenCalledWith("world.webp");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("applies repeat wrapping and mipmaps only when requested", async () => {
    const plain = texture();
    await loadStudentRaceWorldTexture("plain.webp", {
      loadTexture: async () => plain,
    });
    expect(plain.source.style.addressMode).not.toBe("repeat");
    expect(plain.source.autoGenerateMipmaps).toBe(false);
    expect(plain.source.style.maxAnisotropy).not.toBe(16);

    const tiled = texture();
    await loadStudentRaceWorldTexture("tiled.webp", {
      loadTexture: async () => tiled,
      repeat: true,
      mipmaps: true,
      maxAnisotropy: 16,
    });
    expect(tiled.source.style.addressMode).toBe("repeat");
    expect(tiled.source.autoGenerateMipmaps).toBe(true);
    expect(tiled.source.style.maxAnisotropy).toBe(16);
  });

  it("returns a fallback result on load failure without rejecting", async () => {
    const failure = new Error("network down");

    const result = await loadStudentRaceWorldTexture("broken.webp", {
      loadTexture: () => Promise.reject(failure),
    });

    expect(result.status).toBe(WORLD_ASSET_STATUS.FALLBACK);
    expect(result.error).toBe(failure);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns a fallback for an invalid url without calling the loader", async () => {
    const loadTexture = vi.fn();

    expect(
      (await loadStudentRaceWorldTexture(null, { loadTexture })).status,
    ).toBe(WORLD_ASSET_STATUS.FALLBACK);
    expect(
      (await loadStudentRaceWorldTexture("", { loadTexture })).status,
    ).toBe(WORLD_ASSET_STATUS.FALLBACK);
    expect(loadTexture).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settles a stalled asset as fallback at the configured deadline", async () => {
    const settled = vi.fn();
    const pending = loadStudentRaceWorldTexture("stalled.webp", {
      loadTexture: () => new Promise(() => {}),
    });
    pending.then(settled);

    await vi.advanceTimersByTimeAsync(STUDENT_RACE_WORLD_ART.loading.timeoutMs - 1);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    const result = await pending;
    expect(result.status).toBe(WORLD_ASSET_STATUS.FALLBACK);
    expect(result.error.message).toBe("Student race world asset load timed out");
    expect(settled).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not configure or destroy a shared texture that resolves after the deadline", async () => {
    let resolveLoad;
    const loaded = texture();
    const destroy = vi.spyOn(loaded, "destroy");
    const pending = loadStudentRaceWorldTexture("late-success.webp", {
      loadTexture: () => new Promise((resolve) => { resolveLoad = resolve; }),
      repeat: true,
      mipmaps: true,
      maxAnisotropy: 16,
    });
    await vi.advanceTimersByTimeAsync(STUDENT_RACE_WORLD_ART.loading.timeoutMs);
    expect((await pending).status).toBe(WORLD_ASSET_STATUS.FALLBACK);

    resolveLoad(loaded);
    await Promise.resolve();

    expect(loaded.source.style.addressMode).not.toBe("repeat");
    expect(loaded.source.autoGenerateMipmaps).toBe(false);
    expect(loaded.source.style.maxAnisotropy).not.toBe(16);
    expect(destroy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("handles a late rejection without changing the settled fallback or leaving a timer", async () => {
    let rejectLoad;
    const settled = vi.fn();
    const pending = loadStudentRaceWorldTexture("late-failure.webp", {
      loadTexture: () => new Promise((_, reject) => { rejectLoad = reject; }),
    });
    pending.then(settled);
    await vi.advanceTimersByTimeAsync(STUDENT_RACE_WORLD_ART.loading.timeoutMs);
    const fallback = await pending;

    rejectLoad(new Error("late network failure"));
    await vi.advanceTimersByTimeAsync(0);

    expect(await pending).toBe(fallback);
    expect(settled).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the deadline when the underlying loader throws synchronously", async () => {
    const failure = new Error("synchronous load failure");
    const result = await loadStudentRaceWorldTexture("sync-failure.webp", {
      loadTexture: () => { throw failure; },
    });

    expect(result.status).toBe(WORLD_ASSET_STATUS.FALLBACK);
    expect(result.error).toBe(failure);
    expect(vi.getTimerCount()).toBe(0);
  });
});
