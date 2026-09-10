import { playerKartGroundTransform } from "../vehicles/studentRaceVehicleGeometry.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";

export function resolveRaceObjectGeometry(layout, perspective) {
  const ground = playerKartGroundTransform(layout);
  const playerDepth = Math.max(Number.EPSILON, Math.min(1, perspective.depthAtY(ground.y)));
  const playerRoadHalfWidth = perspective.roadHalfWidthAt(playerDepth);
  return { playerGroundY: ground.y, playerDepth, playerRoadHalfWidth,
    playerReferenceDistance: perspective.distanceAtDepth(playerDepth),
    laneStepRatio: ground.width * STUDENT_RACE_VISUAL_CONFIG.opponents.laneGapKartWidths / playerRoadHalfWidth };
}
