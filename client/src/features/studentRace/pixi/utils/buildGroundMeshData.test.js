import { describe, expect, it } from "vitest";

import { buildGroundMeshData } from "./buildGroundMeshData";

const perspective = {
  centerX: 260,
  horizonY: 176,
  depthToY: (t) => 176 + 342 * t * t,
  roadHalfWidthAt: (t) => 20 + 330 * t * t,
  distanceAtDepth: (t) => 150 * 20 * (1 - t * t) / (20 + 330 * t * t),
};

describe("buildGroundMeshData", () => {
  it("spans the frame width and widens the tile range toward the horizon around the vanishing point", () => {
    const data = buildGroundMeshData({
      perspective,
      frameWidth: 520,
      worldBottomY: 518,
      positionToPixelsRatio: 30,
      tileWorldLength: 2880,
      tilesPerRoadWidth: 0.67,
      rows: 2,
      columns: 2,
    });
    const lastRow = 2 * 3 * 2;

    expect(data.positions[0]).toBe(0);
    expect(data.positions[1]).toBe(176);
    expect(data.positions[4]).toBe(520);
    expect(data.positions[lastRow + 1]).toBe(518);

    expect(data.uvs[2]).toBeCloseTo(0.5);
    expect(data.uvs[0]).toBeCloseTo(0.5 - (260 * 0.67) / 40);
    expect(data.uvs[lastRow]).toBeCloseTo(0.5 - (260 * 0.67) / 700);

    expect(data.uvs[1]).toBeCloseTo(4500 / 2880);
    expect(data.uvs[lastRow + 1]).toBe(0);
  });
});
