import {
  compileHighShaderGlProgram,
  compileHighShaderGpuProgram,
  localUniformBit,
  localUniformBitGl,
  roundPixelsBit,
  roundPixelsBitGl,
  Shader,
  textureBit,
  textureBitGl,
} from "pixi.js";

const PROGRAM_NAME = "projected-strip-edge-feather";

export function buildStripEdgeCoordinates({ positions, vertexColumns }) {
  const across = new Float32Array(positions.length / 2);
  for (let vertex = 0; vertex < across.length; vertex += 1) {
    across[vertex] = (vertex % vertexColumns) / (vertexColumns - 1);
  }
  return across;
}

export function createStripEdgeShader(texture, edgeFeatherHalfWidthRatio) {
  const feather = Math.min(0.5, edgeFeatherHalfWidthRatio / 2).toFixed(8);
  const alpha = `finalColor *= smoothstep(0.0, ${feather}, min(vEdgeAcross, 1.0 - vEdgeAcross));`;
  const edgeBit = {
    name: "strip-edge-feather",
    vertex: {
      header: "@in aEdgeAcross: f32; @out vEdgeAcross: f32;",
      main: "vEdgeAcross = aEdgeAcross;",
    },
    fragment: {
      header: "@in vEdgeAcross: f32;",
      end: alpha,
    },
  };
  const edgeBitGl = {
    name: "strip-edge-feather",
    vertex: {
      header: "in float aEdgeAcross; out float vEdgeAcross;",
      main: "vEdgeAcross = aEdgeAcross;",
    },
    fragment: {
      header: "in float vEdgeAcross;",
      end: alpha,
    },
  };

  return new Shader({
    glProgram: compileHighShaderGlProgram({
      name: PROGRAM_NAME,
      bits: [localUniformBitGl, textureBitGl, roundPixelsBitGl, edgeBitGl],
    }),
    gpuProgram: compileHighShaderGpuProgram({
      name: PROGRAM_NAME,
      bits: [localUniformBit, textureBit, roundPixelsBit, edgeBit],
    }),
    resources: {
      uTexture: texture.source,
      uSampler: texture.source.style,
      textureUniforms: {
        uTextureMatrix: { type: "mat3x3<f32>", value: texture.textureMatrix.mapCoord },
      },
    },
  });
}
