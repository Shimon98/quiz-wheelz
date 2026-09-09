import { Container, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { buildProjectedStripMeshData } from "./buildProjectedStripMeshData";
import { ProjectedTextureStrip } from "./ProjectedTextureStrip";

function texture() {
  return new Texture({ source: new TextureSource({ width: 64, height: 64 }) });
}

function frame(width = 520, height = 800) {
  return { width, height };
}

function buildData({ width }) {
  return buildProjectedStripMeshData({
    rows: 2,
    columns: 1,
    edgesAt: (t) => ({ startX: 0, startY: 100 * t, endX: width, endY: 100 * t }),
    alongAt: (t) => 1 - t,
    alongIsU: false,
    acrossAt: () => ({ start: 0, end: width / 100 }),
  });
}

function uv(strip, index) {
  return strip.mesh.geometry.getBuffer("aUV").data[index];
}

describe("ProjectedTextureStrip", () => {
  it("creates the mesh in its container on the first sync and writes the phase", () => {
    const container = new Container();
    const strip = new ProjectedTextureStrip(container, texture(), buildData);
    expect(strip.mesh).toBeNull();

    strip.sync(frame(), 0.25);
    expect(container.children).toEqual([strip.mesh]);
    expect(uv(strip, 1)).toBeCloseTo(1.25);

    strip.sync(frame(), 0.5, -1);
    expect(uv(strip, 1)).toBeCloseTo(-0.5);
    strip.destroy();
  });

  it("rebuilds positions and across uvs only when the size changes", () => {
    const build = vi.fn(buildData);
    const strip = new ProjectedTextureStrip(new Container(), texture(), build);

    strip.sync(frame(), 0);
    strip.sync(frame(), 0.1);
    expect(build).toHaveBeenCalledTimes(1);

    const mesh = strip.mesh;
    strip.sync(frame(360, 640), 0);
    expect(build).toHaveBeenCalledTimes(2);
    expect(strip.mesh).toBe(mesh);
    expect(mesh.geometry.getBuffer("aPosition").data[2]).toBe(360);
    expect(uv(strip, 2)).toBeCloseTo(3.6);
    strip.destroy();
  });

  it("adds optional edge alpha without changing geometry or scrolling coordinates", () => {
    const plain = new ProjectedTextureStrip(new Container(), texture(), buildData);
    const feathered = new ProjectedTextureStrip(new Container(), texture(), buildData, {
      edgeFeatherHalfWidthRatio: 0.04,
    });

    plain.sync(frame(), 0.3);
    feathered.sync(frame(), 0.3);

    expect(plain.mesh.shader).toBeNull();
    expect(feathered.mesh.geometry.positions).toEqual(plain.mesh.geometry.positions);
    expect(feathered.mesh.geometry.uvs).toEqual(plain.mesh.geometry.uvs);
    expect(feathered.mesh.geometry.indices).toEqual(plain.mesh.geometry.indices);
    const edges = feathered.mesh.geometry.getBuffer("aEdgeAcross");
    const shader = feathered.mesh.shader;
    expect(Array.from(edges.data)).toEqual([0, 1, 0, 1, 0, 1]);

    feathered.sync(frame(), 0.8);
    feathered.sync(frame(360, 640), 0.9);
    expect(feathered.mesh.geometry.getBuffer("aEdgeAcross")).toBe(edges);
    expect(feathered.mesh.shader).toBe(shader);
    expect(Array.from(edges.data)).toEqual([0, 1, 0, 1, 0, 1]);
    plain.destroy();
    feathered.destroy();
  });

  it("cleans owned geometry and shader when a layer destroys the parent container", () => {
    const container = new Container();
    const art = texture();
    const strip = new ProjectedTextureStrip(container, art, buildData, {
      edgeFeatherHalfWidthRatio: 0.04,
    });
    strip.sync(frame(), 0);
    const geometry = strip.mesh.geometry;
    const buffers = [...geometry.buffers];
    const destroyed = buffers.map((buffer) => vi.fn().mockName(buffer.label));
    buffers.forEach((buffer, index) => buffer.on("destroy", destroyed[index]));
    const shaderDestroy = vi.spyOn(strip.mesh.shader, "destroy");
    const textureDestroy = vi.spyOn(art, "destroy");

    container.destroy({ children: true });

    destroyed.forEach((listener) => expect(listener).toHaveBeenCalled());
    expect(geometry.attributes).toBeNull();
    expect(shaderDestroy).toHaveBeenCalledExactlyOnceWith();
    expect(textureDestroy).not.toHaveBeenCalled();
    strip.destroy();
    expect(shaderDestroy).toHaveBeenCalledTimes(1);
  });
});
