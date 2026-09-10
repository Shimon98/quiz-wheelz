import { Mesh, MeshGeometry } from "pixi.js";

import { writeStripPhase } from "./buildProjectedStripMeshData";
import { buildStripEdgeCoordinates, createStripEdgeShader } from "./createStripEdgeShader";

export class ProjectedTextureStrip {
  constructor(container, texture, buildData, { edgeFeatherHalfWidthRatio = 0 } = {}) {
    this.container = container;
    this.texture = texture;
    this.buildData = buildData;
    this.edgeFeatherHalfWidthRatio = edgeFeatherHalfWidthRatio;
    this.mesh = null;
    this.data = null;
    this.sizeKey = null;
  }

  sync(frameState, phase, direction = 1) {
    const sizeKey = `${frameState.width}x${frameState.height}`;
    if (this.mesh == null || this.sizeKey !== sizeKey) {
      this.data = this.buildData(frameState);
      this.sizeKey = sizeKey;

      if (this.mesh == null) {
        const geometry = new MeshGeometry({
          positions: this.data.positions,
          uvs: this.data.uvs,
          indices: this.data.indices,
        });
        let shader = null;
        if (this.edgeFeatherHalfWidthRatio > 0) {
          geometry.addAttribute("aEdgeAcross", {
            buffer: buildStripEdgeCoordinates(this.data),
            format: "float32",
          });
          shader = createStripEdgeShader(this.texture, this.edgeFeatherHalfWidthRatio);
        }
        this.mesh = new Mesh({ geometry, texture: this.texture, shader });
        this.mesh.once("destroyed", () => {
          geometry.destroy(true);
          shader?.destroy();
        });
        this.container.addChild(this.mesh);
      } else {
        const positionBuffer = this.mesh.geometry.getBuffer("aPosition");
        positionBuffer.data.set(this.data.positions);
        positionBuffer.update();
        this.mesh.geometry.getBuffer("aUV").data.set(this.data.uvs);
      }
    }

    const uvBuffer = this.mesh.geometry.getBuffer("aUV");
    writeStripPhase(uvBuffer.data, this.data, phase, direction);
    uvBuffer.update();
  }

  destroy() {
    this.mesh?.destroy();
    this.mesh = null;
  }
}
