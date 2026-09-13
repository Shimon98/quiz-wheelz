import { playerKartGroundTransform } from "../vehicles/studentRaceVehicleGeometry.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../assets/studentRaceVehicleManifest.js";

export function resolveRaceObjectGeometry(layout, perspective) {
  const ground = playerKartGroundTransform(layout);
  const playerDepth = Math.max(Number.EPSILON, Math.min(1, perspective.depthAtY(ground.y)));
  const playerRoadHalfWidth = perspective.roadHalfWidthAt(playerDepth);
  const { playerKart, opponents, viewDepthZones } = STUDENT_RACE_VISUAL_CONFIG;
  const frameWidth = layout.playerKart.anchorX / playerKart.screenXRatio;
  const artWidthRatio = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN.baseScale;
  const vehicleVisualScale = Math.min(playerKart.visualScale,
    frameWidth * playerKart.maxParallelWidthRatio / (ground.width * artWidthRatio));
  const kartHalfWidthRatio = ground.width * opponents.kartBoundsHalfWidthRatio * vehicleVisualScale / playerRoadHalfWidth;
  const laneLimitAt = (depth) => Math.max(0, Math.min(opponents.roadClearanceRatio,
    frameWidth / 2 / perspective.roadHalfWidthAt(Math.min(depth, playerDepth))) - kartHalfWidthRatio);
  return { playerGroundY: ground.y, playerDepth, playerRoadHalfWidth, vehicleVisualScale,
    playerReferenceDistance: perspective.distanceAtDepth(playerDepth),
    laneStepRatio: ground.width * vehicleVisualScale * artWidthRatio * (1 + opponents.laneGapKartWidths) / playerRoadHalfWidth,
    laneLimitAt,
    laneLimits: { near: laneLimitAt(playerDepth),
      mid: laneLimitAt(viewDepthZones.mid.maxDepth + opponents.density.zoneHysteresis) } };
}

export function resolveLaneOffsetRatio(laneDelta, laneStepRatio, lateralLimit) {
  if (!(laneStepRatio > 0) || !(lateralLimit > 0)) return 0;
  const magnitude = Math.abs(laneDelta) * laneStepRatio;
  const linearLimit = Math.floor(lateralLimit / laneStepRatio) * laneStepRatio;
  const softRange = lateralLimit - linearLimit;
  const offset = magnitude <= linearLimit ? magnitude
    : linearLimit + softRange * (magnitude - linearLimit) / (magnitude - linearLimit + softRange);
  return Math.sign(laneDelta) * offset;
}
