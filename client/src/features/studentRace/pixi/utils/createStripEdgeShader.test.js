import { Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { buildProjectedStripMeshData, writeStripPhase } from "./buildProjectedStripMeshData";
import { buildStripEdgeCoordinates, createStripEdgeShader } from "./createStripEdgeShader";

describe("projected strip edge feather", () => {
  it("measures the physical strip width independently of cropped and moving texture UVs", () => {
    const data = buildProjectedStripMeshData({
      rows: 3,
      columns: 4,
      edgesAt: (depth) => ({
        startX: 240 - depth * 200,
        startY: 150 + depth * 300,
        endX: 280 + depth * 200,
        endY: 150 + depth * 300,
      }),
      alongAt: (depth) => (1 - depth) * 0.78,
      acrossAt: () => ({ start: 0.12, end: 0.88 }),
      alongIsU: false,
    });
    const across = buildStripEdgeCoordinates(data);

    for (let row = 0; row < 4; row += 1) {
      expect(Array.from(across.slice(row * 5, row * 5 + 5))).toEqual([0, 0.25, 0.5, 0.75, 1]);
    }
    writeStripPhase(data.uvs, data, 0.99);
    expect(buildStripEdgeCoordinates(data)).toEqual(across);
    writeStripPhase(data.uvs, data, 0.01);
    expect(buildStripEdgeCoordinates(data)).toEqual(across);
  });

  it("composes both renderer programs with premultiplied edge alpha and the same texture", () => {
    const texture = new Texture({ source: new TextureSource({ width: 64, height: 64 }) });
    const shader = createStripEdgeShader(texture, 0.04);

    expect(shader.glProgram.vertex).toContain("aEdgeAcross");
    expect(shader.glProgram.fragment).toContain("finalColor *= smoothstep(0.0, 0.02000000");
    expect(shader.gpuProgram.vertex.source).toContain("aEdgeAcross");
    expect(shader.gpuProgram.fragment.source).toContain("finalColor *= smoothstep(0.0, 0.02000000");
    expect(shader.gpuProgram.vertex.source).not.toMatch(/@(in|out)\s/);
    expect(shader.gpuProgram.fragment.source).not.toMatch(/@(in|out)\s/);
    expect(shader.resources.uTexture).toBe(texture.source);
    expect(shader.resources.uSampler).toBe(texture.source.style);
    shader.destroy();
    expect(texture.destroyed).toBe(false);
  });
});
