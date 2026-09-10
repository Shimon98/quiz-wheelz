import { getLoopPhase } from "./getLoopPhase";

const HIDDEN = Object.freeze({
  visible: false,
  depth: 0,
  x: 0,
  y: 0,
  roadHalfWidth: 0,
  alpha: 0,
});
const EXIT_OVERSCAN_PX = 1;

export function projectSceneryPlacement(
  placement,
  {
    worldOffset,
    perspective,
    positionToPixelsRatio,
    band,
    widthPerRoadHalf,
    aspectRatio,
    anchorY = 1,
    frameWidth,
    frameHeight,
  },
) {
  const widthRatio = widthPerRoadHalf * placement.scale;
  const lateralRatio = Math.max(
    placement.lateralRatio,
    band.minRoadClearance + widthRatio / 2,
  );
  const innerRatio = lateralRatio - widthRatio / 2;
  const sideWidth = placement.side < 0
    ? perspective.centerX
    : frameWidth - perspective.centerX;
  const exitHalfWidth = (sideWidth + EXIT_OVERSCAN_PX) / innerRatio;
  const maxDepth = Math.max(1, perspective.depthAtRoadHalfWidth(exitHalfWidth));
  const { loopWorldLength } = band;
  const nearestDistance = perspective.distanceAtDepth(maxDepth);
  const loopAhead = getLoopPhase(
    placement.worldPosition - worldOffset - nearestDistance * positionToPixelsRatio,
    loopWorldLength,
  ) * loopWorldLength;
  const aheadDistance = loopAhead / positionToPixelsRatio + nearestDistance;
  const projected = perspective.projectTrackObject(
    aheadDistance,
    placement.side * lateralRatio,
    { maxDepth },
  );
  if (!projected.visible) return HIDDEN;

  const { appearDepth, fadeInDepth } = band;
  const { depth } = projected;
  const farthestDistance = loopWorldLength / positionToPixelsRatio + nearestDistance;
  const entryDepth = Math.max(appearDepth, perspective.depthAtDistance(farthestDistance));
  const alpha = Math.min(
    1,
    (depth - entryDepth) / fadeInDepth,
  );
  if (alpha <= 0) return HIDDEN;

  const width = projected.roadHalfWidth * widthRatio;
  const height = width / aspectRatio;
  if (
    projected.x + width / 2 < 0 ||
    projected.x - width / 2 > frameWidth ||
    projected.y + height * (1 - anchorY) < 0 ||
    projected.y - height * anchorY > frameHeight
  ) return HIDDEN;

  return {
    visible: true,
    depth,
    x: projected.x,
    y: projected.y,
    roadHalfWidth: projected.roadHalfWidth,
    width,
    height,
    alpha,
  };
}
