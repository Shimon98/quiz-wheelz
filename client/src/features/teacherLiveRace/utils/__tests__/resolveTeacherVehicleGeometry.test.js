import { describe, expect, it } from "vitest";

import { resolveTeacherVehicleGeometry } from "../resolveTeacherVehicleGeometry";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";
import { buildProjectorSurfaceStyle } from "../../styles/teacherRaceProjectorStyles";

const { laneGeometry } = TEACHER_RACE_PROJECTOR_CONFIG;

describe("resolveTeacherVehicleGeometry", () => {
  it("derives the width and the rail inset from the height, the asset ratio and the edge gap", () => {
    expect(
      resolveTeacherVehicleGeometry({
        vehicleAspectRatio: 2,
        compactVehicleHeightRem: 2,
        wideVehicleHeightRem: 3,
        vehicleEdgeGapRem: 0.5,
      }),
    ).toEqual({
      compact: { heightRem: 2, widthRem: 4, railInsetRem: 2.5 },
      wide: { heightRem: 3, widthRem: 6, railInsetRem: 3.5 },
    });
  });

  it("keeps the whole production vehicle inside the strip at 0% and 100% in every tier", () => {
    const { compact, wide } = resolveTeacherVehicleGeometry(laneGeometry);

    for (const box of [compact, wide]) {
      expect(box.widthRem / box.heightRem).toBeCloseTo(laneGeometry.vehicleAspectRatio, 3);
      expect(box.railInsetRem).toBeGreaterThan(box.widthRem / 2);
    }
    expect(wide.heightRem).toBeGreaterThanOrEqual(compact.heightRem);
  });

  it("hands both tiers to the projector surface as rem custom properties", () => {
    const style = buildProjectorSurfaceStyle(laneGeometry);

    expect(Object.keys(style).sort()).toEqual([
      "--qw-projector-rail-inset-compact",
      "--qw-projector-rail-inset-wide",
      "--qw-projector-vehicle-h-compact",
      "--qw-projector-vehicle-h-wide",
      "--qw-projector-vehicle-w-compact",
      "--qw-projector-vehicle-w-wide",
    ]);
    expect(Object.values(style).every((value) => /^\d+(\.\d+)?rem$/.test(value))).toBe(true);
  });
});
