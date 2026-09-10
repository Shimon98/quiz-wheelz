import { describe, expect, it } from "vitest";

import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "./resolveStudentRaceLayoutMetrics";

const { camera, playerKart, layout } = STUDENT_RACE_VISUAL_CONFIG;

function visibleWorldHeight(height) {
  const panel = layout.questionPanel;
  const panelHeight = Math.min(
    panel.maxHeight,
    Math.max(panel.minHeight, height * panel.heightRatio),
  );
  return height - panelHeight + panel.topOverlap;
}

describe("resolveStudentRaceLayoutMetrics width unit", () => {
  it("uses the full frame width on phone frames", () => {
    const metrics = resolveStudentRaceLayoutMetrics({ width: 390, height: 844 });

    expect(metrics.world.widthUnit).toBe(390);
    expect(metrics.playerKart.maxWidth).toBeCloseTo(390 * playerKart.maxWidthRatio);
  });

  it("caps the unit by the visible world height on wide frames", () => {
    const metrics = resolveStudentRaceLayoutMetrics({ width: 736, height: 800 });
    const expectedUnit =
      visibleWorldHeight(800) * camera.widthUnitWorldHeightRatio;

    expect(metrics.world.widthUnit).toBeCloseTo(expectedUnit);
    expect(metrics.world.widthUnit).toBeLessThan(736);
    expect(metrics.playerKart.maxWidth).toBeCloseTo(
      expectedUnit * playerKart.maxWidthRatio,
    );
  });
});
