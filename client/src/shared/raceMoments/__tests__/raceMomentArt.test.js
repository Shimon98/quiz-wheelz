import path from "node:path";
import { describe, expect, it } from "vitest";

import { readWebpHeader, WEBP_CHUNKS, WEBP_RIFF_SIGNATURE } from "../../../test/readWebpHeader";
import { RACE_MOMENT_ART } from "../raceMomentArt";

const ASSET_DIRECTORY = path.resolve(import.meta.dirname, "../../../assets/game/raceMoments");

// Astra's V5 masters (2026-11-07), each cropped to its paint and cut to 128 px on its longest side.
const EXPECTED_FILES = Object.freeze({
  correctAnswer: { file: "moment-correct.webp", width: 128, height: 108 },
  rankUp: { file: "moment-rank-up.webp", width: 128, height: 127 },
  shieldEarned: { file: "moment-shield-earned.webp", width: 128, height: 126 },
  luckTailwind: { file: "moment-luck-tailwind.webp", width: 128, height: 125 },
  luckEnergyOrb: { file: "moment-luck-energy-orb.webp", width: 128, height: 112 },
  luckMud: { file: "moment-luck-mud.webp", width: 119, height: 128 },
  luckShieldBlocked: { file: "moment-luck-shield-blocked.webp", width: 126, height: 128 },
  playerFinished: { file: "moment-player-finished.webp", width: 122, height: 128 },
});

describe("race moment art files", () => {
  it.each(Object.values(EXPECTED_FILES))("ships $file as a transparent WebP at its production size", ({ file, width, height }) => {
    expect(readWebpHeader(path.join(ASSET_DIRECTORY, file)))
      .toEqual({ riff: WEBP_RIFF_SIGNATURE, chunk: WEBP_CHUNKS.EXTENDED, hasAlpha: true, width, height });
  });
});

describe("RACE_MOMENT_ART", () => {
  it("owns the eight new moment icons, each key on its own file", () => {
    expect(Object.keys(RACE_MOMENT_ART)).toEqual(Object.keys(EXPECTED_FILES));
    for (const [key, { file }] of Object.entries(EXPECTED_FILES)) {
      expect(RACE_MOMENT_ART[key], key).toContain(file);
    }
  });
});
