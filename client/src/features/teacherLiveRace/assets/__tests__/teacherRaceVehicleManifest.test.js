import { describe, expect, it } from "vitest";

import { RACE_VEHICLE_COLOR_KEYS } from "../../../../shared/raceVehicles/raceVehicleIdentity";
import {
  resolveTeacherRaceVehicleAsset,
  TEACHER_RACE_VEHICLE_MANIFEST,
} from "../teacherRaceVehicleManifest";

const SIDE_VIEW_URL = "/assets/hover-kart-green-side.webp";
const MANIFEST = Object.freeze({ TOY_CAR_GREEN: SIDE_VIEW_URL });

describe("resolveTeacherRaceVehicleAsset", () => {
  it("returns the side-view asset mapped to a server vehicleAssetKey", () => {
    expect(resolveTeacherRaceVehicleAsset("TOY_CAR_GREEN", MANIFEST)).toBe(SIDE_VIEW_URL);
  });

  it.each([
    ["an unmapped future key", "TOY_CAR_GOLD"],
    ["an empty key", ""],
    ["a missing key", undefined],
    ["a null key", null],
    ["a non-string key", 7],
    ["an inherited object member", "constructor"],
    ["an inherited method", "toString"],
    ["the prototype accessor", "__proto__"],
  ])("returns null for %s", (_label, vehicleAssetKey) => {
    expect(resolveTeacherRaceVehicleAsset(vehicleAssetKey, MANIFEST)).toBeNull();
  });

  it("resolves against the production manifest by default without throwing", () => {
    expect(resolveTeacherRaceVehicleAsset("TOY_CAR_UNKNOWN_FUTURE")).toBeNull();
  });
});

describe("TEACHER_RACE_VEHICLE_MANIFEST", () => {
  const colors = Object.values(RACE_VEHICLE_COLOR_KEYS);

  it.each(colors)("maps TOY_CAR_%s to its own teacher side-view art", (color) => {
    const asset = resolveTeacherRaceVehicleAsset(`TOY_CAR_${color}`);

    expect(asset).toContain(`teacherRace/hoverKarts/hover-kart-${color.toLowerCase()}-side`);
    expect(asset).not.toContain("studentRace");
  });

  it("maps exactly the eight identity colors, each to a different file", () => {
    expect(Object.keys(TEACHER_RACE_VEHICLE_MANIFEST).sort()).toEqual(
      colors.map((color) => `TOY_CAR_${color}`).sort(),
    );
    expect(new Set(Object.values(TEACHER_RACE_VEHICLE_MANIFEST)).size).toBe(colors.length);
  });
});
