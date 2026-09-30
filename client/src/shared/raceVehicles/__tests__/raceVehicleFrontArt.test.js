import { describe, expect, it } from "vitest";

import { RACE_VEHICLE_FRONT_ART, resolveRaceVehicleFrontArt } from "../raceVehicleFrontArt";
import { RACE_VEHICLE_COLOR_KEYS } from "../raceVehicleIdentity";
import { RACE_VEHICLE_SIDE_ART } from "../raceVehicleSideArt";

const FRONT_VIEW_URL = "/assets/hover-kart-green-front.webp";
const ART = Object.freeze({ TOY_CAR_GREEN: FRONT_VIEW_URL });

describe("resolveRaceVehicleFrontArt", () => {
  it("returns the front hero art mapped to a server vehicleAssetKey", () => {
    expect(resolveRaceVehicleFrontArt("TOY_CAR_GREEN", ART)).toBe(FRONT_VIEW_URL);
  });

  it.each([
    ["an unmapped future key", "TOY_CAR_GOLD"],
    ["an empty key", ""],
    ["a missing key", undefined],
    ["a null key", null],
    ["a non-string key", 7],
    ["an inherited object member", "constructor"],
    ["the prototype accessor", "__proto__"],
  ])("returns null for %s", (_label, vehicleAssetKey) => {
    expect(resolveRaceVehicleFrontArt(vehicleAssetKey, ART)).toBeNull();
  });

  it("resolves against the production art by default without throwing", () => {
    expect(resolveRaceVehicleFrontArt("TOY_CAR_UNKNOWN_FUTURE")).toBeNull();
  });
});

describe("RACE_VEHICLE_FRONT_ART", () => {
  const colors = Object.values(RACE_VEHICLE_COLOR_KEYS);

  it.each(colors)("maps TOY_CAR_%s to its own front hero art", (color) => {
    const asset = resolveRaceVehicleFrontArt(`TOY_CAR_${color}`);

    expect(asset).toContain(`raceResults/heroKarts/hover-kart-${color.toLowerCase()}-front`);
  });

  it("covers exactly the vehicles that have side-view art, each with a different file", () => {
    expect(Object.keys(RACE_VEHICLE_FRONT_ART).sort()).toEqual(Object.keys(RACE_VEHICLE_SIDE_ART).sort());
    expect(new Set(Object.values(RACE_VEHICLE_FRONT_ART)).size).toBe(colors.length);
  });
});
