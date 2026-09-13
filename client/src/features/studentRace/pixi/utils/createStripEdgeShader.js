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

export function buildStripDepthCoordinates({ positions, vertexColumns }) {
  const depth = new Float32Array(positions.length / 2);
  const rows = depth.length / vertexColumns - 1;
  for (let vertex = 0; vertex < depth.length; vertex += 1) {
    depth[vertex] = Math.floor(vertex / vertexColumns) / rows;
  }
  return depth;
}

export function createStripEdgeShader(texture, edgeFeatherHalfWidthRatio, horizonFadeDepth = 0) {
  const feather = Math.min(0.5, edgeFeatherHalfWidthRatio / 2).toFixed(8);
  const horizonAlpha = horizonFadeDepth > 0
    ? `finalColor *= smoothstep(0.0, ${horizonFadeDepth.toFixed(8)}, vEdgeDepth);` : "";
  const alpha = `finalColor *= smoothstep(0.0, ${feather}, min(vEdgeAcross, 1.0 - vEdgeAcross)); ${horizonAlpha}`;
  const edgeBit = {
    name: "strip-edge-feather",
    vertex: {
      header: "@in aEdgeAcross: f32; @out vEdgeAcross: f32; @in aEdgeDepth: f32; @out vEdgeDepth: f32;",
      main: "vEdgeAcross = aEdgeAcross; vEdgeDepth = aEdgeDepth;",
    },
    fragment: {
      header: "@in vEdgeAcross: f32; @in vEdgeDepth: f32;",
      end: alpha,
    },
  };
  const edgeBitGl = {
    name: "strip-edge-feather",
    vertex: {
      header: "in float aEdgeAcross; out float vEdgeAcross; in float aEdgeDepth; out float vEdgeDepth;",
      main: "vEdgeAcross = aEdgeAcross; vEdgeDepth = aEdgeDepth;",
    },
    fragment: {
      header: "in float vEdgeAcross; in float vEdgeDepth;",
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
