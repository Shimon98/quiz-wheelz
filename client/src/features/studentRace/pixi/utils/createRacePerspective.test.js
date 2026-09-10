import { describe, expect, it } from "vitest";

import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "../../utils/resolveStudentRaceLayoutMetrics";
import { createRacePerspective } from "./createRacePerspective";

const VIEW_DISTANCE_AHEAD = 150;

function perspectiveFor(width, height) {
  const { world } = resolveStudentRaceLayoutMetrics({ width, height });
  return createRacePerspective({
    width,
    worldBottomY: world.bottomY,
    widthUnit: world.widthUnit,
    camera: STUDENT_RACE_VISUAL_CONFIG.camera,
    viewDistanceAhead: VIEW_DISTANCE_AHEAD,
  });
}

describe("createRacePerspective", () => {
  it.each([[360, 640], [430, 932], [960, 1366], [736, 800], [441.6, 480]])(
    "preserves the road and panel geometry at %s by %s",
    (width, height) => {
      const { world } = resolveStudentRaceLayoutMetrics({ width, height });
      const projection = perspectiveFor(width, height);
      const camera = STUDENT_RACE_VISUAL_CONFIG.camera;

      expect(projection.horizonY).toBe(world.bottomY * camera.horizonYRatio);
      expect(projection.depthToY(1)).toBeCloseTo(world.bottomY);
      expect(projection.roadHalfWidthAt(0)).toBeCloseTo(world.widthUnit * 0.045);
      expect(projection.roadHalfWidthAt(1)).toBeCloseTo(world.widthUnit * 0.825);

      const mid = projection.projectTrackObject(projection.distanceAtDepth(0.5), -1);
      expect(mid.depth).toBeCloseTo(0.5);
      expect(mid.x).toBeCloseTo(width / 2 - world.widthUnit * 0.24);
      expect(mid.y).toBeCloseTo(world.bottomY * (0.34 + 0.66 * 0.25));
    },
  );

  it("keeps the default finish and opponent visibility bounded ahead of the player", () => {
    const projection = perspectiveFor(736, 800);

    expect(projection.projectTrackObject(-0.001).visible).toBe(false);
    expect(projection.projectTrackObject(150.001).visible).toBe(false);
    expect(projection.projectTrackObject(0).depth).toBeCloseTo(1);
    expect(projection.projectTrackObject(150).depth).toBeCloseTo(0);
  });

  it("extends only an opted-in decorative call without changing its geometry or future calls", () => {
    const projection = perspectiveFor(736, 800);
    const atPanel = projection.projectTrackObject(0, 1.2);
    const distance = projection.distanceAtDepth(1.1);
    const behind = projection.projectTrackObject(distance, 1.2, { maxDepth: 1.2 });

    expect(behind.visible).toBe(true);
    expect(behind.depth).toBeCloseTo(1.1);
    expect(behind.y).toBeGreaterThan(atPanel.y);
    expect(behind.x).toBeGreaterThan(atPanel.x);
    expect(behind.roadHalfWidth).toBeCloseTo(projection.roadHalfWidthAt(1.1));
    expect(projection.projectTrackObject(projection.distanceAtDepth(1.2) - 0.01, 1.2, { maxDepth: 1.2 }).visible).toBe(false);
    expect(projection.projectTrackObject(distance, 1.2).visible).toBe(false);
    expect(projection.projectTrackObject(-10, 1.2, { maxDepth: 100 }).visible).toBe(false);
  });

  it("resolves a roadside exit depth through the same width equation", () => {
    const projection = perspectiveFor(736, 800);
    const halfWidth = 369 / 0.98;
    const depth = projection.depthAtRoadHalfWidth(halfWidth);

    expect(depth).toBeGreaterThan(1);
    expect(projection.roadHalfWidthAt(depth)).toBeCloseTo(halfWidth);
  });

  it.each([0, 0.2, 0.35, 0.5, 0.7, 0.95, 1, 1.4])(
    "round-trips visual depth %s through the same camera distance",
    (depth) => {
      const projection = perspectiveFor(412, 915);
      expect(projection.depthAtDistance(projection.distanceAtDepth(depth))).toBeCloseTo(depth);
    },
  );

  it("accelerates optical flow strongly toward the camera with no zone-boundary discontinuity", () => {
    const projection = perspectiveFor(412, 915);
    const velocityAt = (depth, movement = 4) => {
      const distance = projection.distanceAtDepth(depth);
      const initial = projection.projectTrackObject(distance);
      const next = projection.projectTrackObject(distance - movement / 1000);
      return (next.y - initial.y) * 1000;
    };
    const far = velocityAt(0.2);
    const mid = velocityAt(0.5);
    const near = velocityAt(0.95);

    expect(mid).toBeGreaterThan(far * 5);
    expect(near).toBeGreaterThan(mid * 5);
    expect(near).toBeGreaterThan(100);
    expect(velocityAt(0.95, 8) / near).toBeCloseTo(2, 2);
    [0.35, 0.7].forEach((boundary) => {
      expect(velocityAt(boundary + 0.00001) / velocityAt(boundary - 0.00001)).toBeCloseTo(1, 3);
    });
  });
});
