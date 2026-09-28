import { describe, expect, it } from "vitest";

import { RACE_VEHICLE_COLOR_KEYS } from "../raceVehicleIdentity";
import { RACE_VEHICLE_SIDE_ART, resolveRaceVehicleSideArt } from "../raceVehicleSideArt";

const SIDE_VIEW_URL = "/assets/hover-kart-green-side.webp";
const ART = Object.freeze({ TOY_CAR_GREEN: SIDE_VIEW_URL });

describe("resolveRaceVehicleSideArt", () => {
  it("returns the side-view art mapped to a server vehicleAssetKey", () => {
    expect(resolveRaceVehicleSideArt("TOY_CAR_GREEN", ART)).toBe(SIDE_VIEW_URL);
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
    expect(resolveRaceVehicleSideArt(vehicleAssetKey, ART)).toBeNull();
  });

  it("resolves against the production art by default without throwing", () => {
    expect(resolveRaceVehicleSideArt("TOY_CAR_UNKNOWN_FUTURE")).toBeNull();
  });
});

describe("RACE_VEHICLE_SIDE_ART", () => {
  const colors = Object.values(RACE_VEHICLE_COLOR_KEYS);

  it.each(colors)("maps TOY_CAR_%s to its own side-view art", (color) => {
    const asset = resolveRaceVehicleSideArt(`TOY_CAR_${color}`);

    expect(asset).toContain(`teacherRace/hoverKarts/hover-kart-${color.toLowerCase()}-side`);
    expect(asset).not.toContain("studentRace");
  });

  it("maps exactly the eight identity colors, each to a different file", () => {
    expect(Object.keys(RACE_VEHICLE_SIDE_ART).sort()).toEqual(
      colors.map((color) => `TOY_CAR_${color}`).sort(),
    );
    expect(new Set(Object.values(RACE_VEHICLE_SIDE_ART)).size).toBe(colors.length);
  });
});
