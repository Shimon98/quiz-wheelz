import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { resolveStudentRaceLayoutMetrics } from "../../utils/resolveStudentRaceLayoutMetrics";
import { buildGroundMeshData } from "./buildGroundMeshData";
import { buildRoadMeshData } from "./buildRoadMeshData";
import { createRacePerspective } from "./createRacePerspective";
import { getLoopPhase } from "./getLoopPhase";
import { writeStripPhase } from "./buildProjectedStripMeshData";

const { positionToPixelsRatio } = STUDENT_RACE_ANIMATION_CONFIG.serverUnits;

function setup(width, height, kind) {
  const { world } = resolveStudentRaceLayoutMetrics({ width, height });
  const perspective = createRacePerspective({
    width,
    worldBottomY: world.bottomY,
    widthUnit: world.widthUnit,
    camera: STUDENT_RACE_VISUAL_CONFIG.camera,
    viewDistanceAhead: STUDENT_RACE_ANIMATION_CONFIG.projection.viewDistanceAhead,
  });
  const art = STUDENT_RACE_WORLD_ART[kind];
  const build = kind === "road" ? buildRoadMeshData : buildGroundMeshData;
  const data = build({
    perspective,
    frameWidth: width,
    worldBottomY: world.bottomY,
    positionToPixelsRatio,
    tileWorldLength: art.tileWorldLength,
    tilesPerRoadWidth: art.tilesPerRoadWidth,
    surfaceInsetURatio: art.surfaceInsetURatio,
    rows: art.meshRows,
    columns: art.meshColumns,
  });
  return { perspective, data, art };
}

function surfaceYAt(data, along) {
  const { baseAlong, positions, vertexColumns } = data;
  for (let row = 1; row < baseAlong.length; row += 1) {
    if (along < baseAlong[row]) continue;
    const progress = (baseAlong[row - 1] - along) / (baseAlong[row - 1] - baseAlong[row]);
    const before = positions[(row - 1) * vertexColumns * 2 + 1];
    const after = positions[row * vertexColumns * 2 + 1];
    return before + (after - before) * progress;
  }
  throw new Error("Surface feature is outside the camera window");
}

describe.each(["road", "ground"])("%s physical surface motion", (kind) => {
  it.each([[320, 640], [412, 915], [960, 1366]])(
    "keeps its texture features attached to projected ground anchors at %s by %s",
    (width, height) => {
      const { perspective, data, art } = setup(width, height, kind);
      for (let row = 3; row < art.meshRows; row += 1) {
        for (const fraction of [0, 0.25, 0.5, 0.75]) {
          const depth = (row + fraction) / art.meshRows;
          const stationaryPosition = perspective.distanceAtDepth(depth);
          let previousY = -Infinity;
          for (let frame = 0; frame < 6; frame += 1) {
            const distance = stationaryPosition - frame * 4 / 120;
            if (distance < 0) break;
            const projected = perspective.projectTrackObject(distance, 1);
            const textureY = surfaceYAt(data, distance * positionToPixelsRatio / art.tileWorldLength);
            expect(Math.abs(textureY - projected.y)).toBeLessThan(0.5);
            expect(textureY).toBeGreaterThan(previousY);
            previousY = textureY;
          }
        }
      }
    },
  );

  it("crosses a texture repeat without a visible phase jump", () => {
    const { data, art } = setup(412, 915, kind);
    const travelWorldPx = 0.01;
    const before = data.uvs.slice();
    const after = data.uvs.slice();
    writeStripPhase(before, data, getLoopPhase(art.tileWorldLength - travelWorldPx, art.tileWorldLength));
    writeStripPhase(after, data, getLoopPhase(art.tileWorldLength + travelWorldPx, art.tileWorldLength));

    for (let index = 1; index < before.length; index += 2) {
      expect(after[index] - before[index] + 1).toBeCloseTo(2 * travelWorldPx / art.tileWorldLength, 5);
    }
  });
});
