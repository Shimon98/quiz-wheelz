import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig.js";
import { resolveStudentRaceLayoutMetrics } from "../../utils/resolveStudentRaceLayoutMetrics.js";
import { createRacePerspective } from "../utils/createRacePerspective.js";
import { resolveRaceObjectGeometry } from "../utils/resolveRaceObjectGeometry.js";
import { mapRaceStateToRuntime } from "../../runtime/mapRaceStateToRuntime.js";
import { raceResponse } from "../../runtime/studentRaceTestFixtures.js";

export function opponentFrame({ width = 520, height = 800, position = 200, lane = 4, deltaMs = 16 } = {}) {
  const layout = resolveStudentRaceLayoutMetrics({ width, height });
  const perspective = createRacePerspective({ width, worldBottomY: layout.world.bottomY,
    widthUnit: layout.world.widthUnit, camera: STUDENT_RACE_VISUAL_CONFIG.camera,
    viewDistanceAhead: STUDENT_RACE_ANIMATION_CONFIG.projection.viewDistanceAhead });
  const geometry = resolveRaceObjectGeometry(layout, perspective);
  const runtimeState = mapRaceStateToRuntime(raceResponse({ position }));
  runtimeState.player.laneNumber = lane;
  return { width, height, layout, perspective, ...geometry, runtimeState, deltaMs,
    raceObjectCameraPosition: position - geometry.playerReferenceDistance,
    visualPosition: position, visualSpeed: 0 };
}

export const fallbackVehicle = async () => ({ status: "fallback" });
