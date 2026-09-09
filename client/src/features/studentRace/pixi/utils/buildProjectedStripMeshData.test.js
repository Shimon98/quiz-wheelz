import { describe, expect, it } from "vitest";

import {
  buildProjectedStripMeshData,
  writeStripPhase,
} from "./buildProjectedStripMeshData";

const edgesAt = (t) => ({
  startX: 100,
  startY: 10 + 90 * t,
  endX: 100 + 50 * t,
  endY: 10 + 90 * t,
});
const alongAt = (t) => (1 - t) * 3;

describe("buildProjectedStripMeshData", () => {
  it("maps the along-depth coordinate to u when alongIsU is set", () => {
    const data = buildProjectedStripMeshData({
      rows: 4,
      columns: 2,
      edgesAt,
      alongAt,
      alongIsU: true,
    });

    expect(data.vertexColumns).toBe(3);
    expect(data.baseAlong[0]).toBeCloseTo(3);
    expect(data.uvs[0]).toBeCloseTo(3);
    expect(data.uvs[1]).toBe(0);
    expect(data.uvs[2 * 2 + 1]).toBe(1);
    expect(data.positions[2 * 2]).toBe(100);
    expect(data.positions[(4 * 3 + 2) * 2]).toBeCloseTo(150);
    expect(data.indices.length).toBe(4 * 2 * 6);
  });

  it("maps the along-depth coordinate to v otherwise", () => {
    const data = buildProjectedStripMeshData({
      rows: 2,
      columns: 1,
      edgesAt,
      alongAt,
      alongIsU: false,
    });

    expect(data.uvs[0]).toBe(0);
    expect(data.uvs[1]).toBeCloseTo(3);
    expect(data.uvs[2]).toBe(1);
  });

  it("spreads the across component over the per-row range from acrossAt", () => {
    const data = buildProjectedStripMeshData({
      rows: 1,
      columns: 2,
      edgesAt,
      alongAt,
      alongIsU: false,
      acrossAt: (t) => ({ start: -1 - t, end: 2 + t }),
    });

    expect(data.uvs[0]).toBeCloseTo(-1);
    expect(data.uvs[1 * 2]).toBeCloseTo(0.5);
    expect(data.uvs[2 * 2]).toBeCloseTo(2);
    expect(data.uvs[3 * 2]).toBeCloseTo(-2);
    expect(data.uvs[5 * 2]).toBeCloseTo(3);
  });

  it("writes the phase into the along component with a direction", () => {
    const data = buildProjectedStripMeshData({
      rows: 2,
      columns: 1,
      edgesAt,
      alongAt,
      alongIsU: true,
    });
    const uvs = Float32Array.from(data.uvs);

    writeStripPhase(uvs, data, 0.25);
    expect(uvs[0]).toBeCloseTo(3.25);
    expect(uvs[1]).toBe(0);

    writeStripPhase(uvs, data, 0.37, -1);
    expect(uvs[0]).toBeCloseTo(0.37 - 3);
    expect(uvs[(2 * 2 + 1) * 2]).toBeCloseTo(0.37);
  });
});
