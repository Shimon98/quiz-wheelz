import { readFileSync } from "node:fs";

const ALPHA_FLAG = 0x10;
const VP8_DIMENSION_MASK = 0x3fff;

export const WEBP_RIFF_SIGNATURE = "RIFFWEBP";

export const WEBP_CHUNKS = Object.freeze({
  EXTENDED: "VP8X",
  SIMPLE_LOSSY: "VP8 ",
});

export function readWebpHeader(filePath) {
  const bytes = readFileSync(filePath);
  const riff = bytes.toString("latin1", 0, 4) + bytes.toString("latin1", 8, 12);
  const chunk = bytes.toString("latin1", 12, 16);

  if (chunk === WEBP_CHUNKS.EXTENDED) {
    return {
      riff,
      chunk,
      hasAlpha: (bytes[20] & ALPHA_FLAG) !== 0,
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }

  return {
    riff,
    chunk,
    hasAlpha: false,
    width: bytes.readUInt16LE(26) & VP8_DIMENSION_MASK,
    height: bytes.readUInt16LE(28) & VP8_DIMENSION_MASK,
  };
}
