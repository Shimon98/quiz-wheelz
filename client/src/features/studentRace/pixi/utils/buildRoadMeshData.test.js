import { describe, expect, it } from "vitest";

import { buildRoadMeshData } from "./buildRoadMeshData";

const perspective = {
  centerX: 260,
  horizonY: 176,
  depthToY: (t) => 176 + (518 - 176) * t * t,
  roadHalfWidthAt: (t) => 47 + (351 - 47) * t * t,
  distanceAtDepth: (t) => 150 * 47 * (1 - t * t) / (47 + 304 * t * t),
};

function build(options = {}) {
  return buildRoadMeshData({
    perspective,
    worldBottomY: 518,
    positionToPixelsRatio: 30,
    tileWorldLength: 960,
    rows: 24,
    ...options,
  });
}

describe("buildRoadMeshData", () => {
  it("samples the mud interior without narrowing the road or changing travel phase", () => {
    const original = build();
    const mud = build({ surfaceInsetURatio: 0.12 });

    expect(mud.positions).toEqual(original.positions);
    expect(mud.indices).toEqual(original.indices);
    expect(mud.baseV).toEqual(original.baseV);
    for (let row = 0; row < mud.baseV.length; row += 1) {
      expect(mud.uvs[row * 4]).toBeCloseTo(0.12);
      expect(mud.uvs[row * 4 + 2]).toBeCloseTo(0.88);
    }
  });

  it("spans the road trapezoid from horizon to world bottom", () => {
    const { positions } = build();

    expect(positions[0]).toBeCloseTo(260 - 47);
    expect(positions[1]).toBeCloseTo(176);
    expect(positions[2]).toBeCloseTo(260 + 47);
    expect(positions[positions.length - 3]).toBeCloseTo(518);
    expect(positions[positions.length - 4]).toBeCloseTo(260 - 351);
    expect(positions[positions.length - 2]).toBeCloseTo(260 + 351);
  });

  it("maps texture v from the far distance down to zero at the player", () => {
    const { baseV, uvs } = build();

    expect(baseV[0]).toBeCloseTo(4500 / 960);
    expect(baseV[baseV.length - 1]).toBe(0);
    for (let row = 1; row < baseV.length; row += 1) {
      expect(baseV[row]).toBeLessThan(baseV[row - 1]);
    }
    expect(uvs[1]).toBeCloseTo(baseV[0]);
    expect(uvs[uvs.length - 1]).toBe(0);
  });

  it("triangulates every row slice", () => {
    const { indices } = build();

    expect(indices.length).toBe(24 * 6);
    expect(Math.max(...indices)).toBe(24 * 2 + 1);
  });

  it("subdivides rows into columns for perspective-safe texturing", () => {
    const { positions, uvs, indices, vertexColumns } = buildRoadMeshData({
      perspective,
      worldBottomY: 518,
      positionToPixelsRatio: 30,
      tileWorldLength: 960,
      rows: 24,
      columns: 8,
    });

    expect(vertexColumns).toBe(9);
    expect(positions.length).toBe(25 * 9 * 2);
    expect(positions[8 * 2]).toBeCloseTo(260 + 47);
    expect(uvs[8 * 2]).toBe(1);
    expect(uvs[4 * 2]).toBeCloseTo(0.5);
    expect(indices.length).toBe(24 * 8 * 6);
    expect(Math.max(...indices)).toBe(25 * 9 - 1);
  });
});
