import path from "node:path";
import { describe, expect, it } from "vitest";

import { RACE_VEHICLE_COLOR_KEYS } from "../../../../shared/raceVehicles/raceVehicleIdentity";
import { readWebpHeader, WEBP_CHUNKS, WEBP_RIFF_SIGNATURE } from "../../../../test/readWebpHeader";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";

const ASSET_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../assets/game/teacherRace/hoverKarts",
);
const EXPECTED_SIZE = Object.freeze({ width: 384, height: 226 });

function readSideViewHeader(color) {
  return readWebpHeader(path.join(ASSET_DIRECTORY, `hover-kart-${color.toLowerCase()}-side.webp`));
}

describe("teacher side-view vehicle files", () => {
  it.each(Object.values(RACE_VEHICLE_COLOR_KEYS))(
    "ships %s as a transparent WebP on the shared canvas",
    (color) => {
      expect(readSideViewHeader(color)).toEqual({
        riff: WEBP_RIFF_SIGNATURE,
        chunk: WEBP_CHUNKS.EXTENDED,
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
