import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { RACE_VEHICLE_COLOR_KEYS } from "../../../../shared/raceVehicles/raceVehicleIdentity";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";

const ASSET_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../assets/game/teacherRace/hoverKarts",
);
const EXTENDED_WEBP_SIGNATURE = "RIFFWEBPVP8X";
const ALPHA_FLAG = 0x10;
const EXPECTED_SIZE = Object.freeze({ width: 384, height: 226 });

function readWebpHeader(color) {
  const bytes = readFileSync(
    path.join(ASSET_DIRECTORY, `hover-kart-${color.toLowerCase()}-side.webp`),
  );

  return {
    signature: bytes.toString("latin1", 0, 4) + bytes.toString("latin1", 8, 16),
    hasAlpha: (bytes[20] & ALPHA_FLAG) !== 0,
    width: bytes.readUIntLE(24, 3) + 1,
    height: bytes.readUIntLE(27, 3) + 1,
  };
}

describe("teacher side-view vehicle files", () => {
  it.each(Object.values(RACE_VEHICLE_COLOR_KEYS))(
    "ships %s as a transparent WebP on the shared canvas",
    (color) => {
      expect(readWebpHeader(color)).toEqual({
        signature: EXTENDED_WEBP_SIGNATURE,
        hasAlpha: true,
        ...EXPECTED_SIZE,
      });
    },
  );

  it("keeps the configured vehicle aspect ratio equal to the real canvas", () => {
    expect(TEACHER_RACE_PROJECTOR_CONFIG.laneGeometry.vehicleAspectRatio).toBeCloseTo(
      EXPECTED_SIZE.width / EXPECTED_SIZE.height,
      6,
    );
  });
});
