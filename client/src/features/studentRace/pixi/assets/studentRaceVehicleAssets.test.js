import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadStudentRaceVehicleAssets,
  resolveStudentRaceVehicleAsset,
  VEHICLE_ASSET_FALLBACK_REASON,
  VEHICLE_ASSET_STATUS,
} from "./studentRaceVehicleAssets";

// C1-06B foundation — synthetic manifest + injected loader; no image files
// and no real Pixi Assets calls are needed.

function greenDefinition(overrides = {}) {
  return {
    idleFrames: ["green-01.webp"],
    anchorX: 0.5,
    anchorY: 0.88,
    baseScale: 1,
    ...overrides,
  };
}

function syntheticManifest() {
  return {
    TOY_CAR_GREEN: greenDefinition(),
    TOY_CAR_RED: greenDefinition({ idleFrames: ["red-01.webp", "red-02.webp"] }),
    TOY_CAR_BLUE: greenDefinition({ idleFrames: ["blue-01.webp"] }),
  };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveStudentRaceVehicleAsset", () => {
  it("returns the definition for a known key", () => {
    const manifest = syntheticManifest();

    expect(resolveStudentRaceVehicleAsset("TOY_CAR_GREEN", manifest)).toBe(
      manifest.TOY_CAR_GREEN,
    );
  });

  it("returns null for an unknown key without throwing", () => {
    expect(
      resolveStudentRaceVehicleAsset("TOY_CAR_PURPLE", syntheticManifest()),
    ).toBeNull();
  });

  it("returns null for non-string keys and inherited object properties", () => {
    const manifest = syntheticManifest();

    expect(resolveStudentRaceVehicleAsset(null, manifest)).toBeNull();
    expect(resolveStudentRaceVehicleAsset("", manifest)).toBeNull();
    expect(resolveStudentRaceVehicleAsset("toString", manifest)).toBeNull();
  });
});

describe("loadStudentRaceVehicleAssets", () => {
  it("loads ONLY the requested vehicle's frames", async () => {
    const loadTexture = vi.fn(async (frameUrl) => ({ frameUrl }));

    const result = await loadStudentRaceVehicleAssets("TOY_CAR_GREEN", {
      manifest: syntheticManifest(),
      loadTexture,
    });

    expect(result.status).toBe(VEHICLE_ASSET_STATUS.LOADED);
    expect(loadTexture.mock.calls.map(([url]) => url)).toEqual([
      "green-01.webp",
    ]);
  });

  it("supports a single static frame (C1-06C)", async () => {
    const result = await loadStudentRaceVehicleAssets("TOY_CAR_GREEN", {
      manifest: syntheticManifest(),
      loadTexture: async (frameUrl) => ({ frameUrl }),
    });

    expect(result.textures).toEqual([{ frameUrl: "green-01.webp" }]);
    expect(result.definition.anchorY).toBe(0.88);
  });

  it("returns multiple frames in manifest order even when loads finish out of order", async () => {
    const frames = ["idle-01.webp", "idle-02.webp", "idle-03.webp", "idle-04.webp"];
    const manifest = { TOY_CAR_GREEN: greenDefinition({ idleFrames: frames }) };

    // Later frames resolve sooner — order must still follow the manifest.
    const loadTexture = (frameUrl) =>
      new Promise((resolve) => {
        const delay = 40 - frames.indexOf(frameUrl) * 10;
        setTimeout(() => resolve({ frameUrl }), delay);
      });

    const result = await loadStudentRaceVehicleAssets("TOY_CAR_GREEN", {
      manifest,
      loadTexture,
    });

    expect(result.textures.map((texture) => texture.frameUrl)).toEqual(frames);
  });

  it("falls back on an unknown key without calling the loader", async () => {
    const loadTexture = vi.fn();

    const result = await loadStudentRaceVehicleAssets("TOY_CAR_PURPLE", {
      manifest: syntheticManifest(),
      loadTexture,
    });

    expect(result).toEqual({
      status: VEHICLE_ASSET_STATUS.FALLBACK,
      vehicleAssetKey: "TOY_CAR_PURPLE",
      reason: VEHICLE_ASSET_FALLBACK_REASON.UNKNOWN_KEY,
    });
    expect(loadTexture).not.toHaveBeenCalled();
  });

  it("falls back with the original error when texture loading fails", async () => {
    const loadError = new Error("network down");

    const result = await loadStudentRaceVehicleAssets("TOY_CAR_GREEN", {
      manifest: syntheticManifest(),
      loadTexture: () => Promise.reject(loadError),
    });

    expect(result.status).toBe(VEHICLE_ASSET_STATUS.FALLBACK);
    expect(result.reason).toBe(VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED);
    expect(result.error).toBe(loadError);
  });

  it.each([
    ["empty idleFrames", { idleFrames: [] }],
    ["non-array idleFrames", { idleFrames: "green-01.webp" }],
    ["empty frame url", { idleFrames: [""] }],
    ["non-finite anchor", { anchorY: NaN }],
    ["anchorX below 0", { anchorX: -0.1 }],
    ["anchorX above 1", { anchorX: 1.1 }],
    ["anchorY below 0", { anchorY: -0.1 }],
    ["anchorY above 1", { anchorY: 1.1 }],
    ["non-positive baseScale", { baseScale: 0 }],
  ])("falls back safely on a malformed entry: %s", async (_label, overrides) => {
    const loadTexture = vi.fn();

    const result = await loadStudentRaceVehicleAssets("TOY_CAR_GREEN", {
      manifest: { TOY_CAR_GREEN: greenDefinition(overrides) },
      loadTexture,
    });

    expect(result.status).toBe(VEHICLE_ASSET_STATUS.FALLBACK);
    expect(result.reason).toBe(VEHICLE_ASSET_FALLBACK_REASON.INVALID_DEFINITION);
    expect(loadTexture).not.toHaveBeenCalled();
  });
});
