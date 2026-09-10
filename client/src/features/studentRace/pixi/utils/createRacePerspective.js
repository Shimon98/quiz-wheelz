export function createRacePerspective({
  width,
  worldBottomY,
  widthUnit,
  camera,
  viewDistanceAhead,
}) {
  const horizonY = worldBottomY * camera.horizonYRatio;
  const centerX = width * camera.vanishingPointXRatio;
  const topHalf = (widthUnit * camera.roadTopWidthRatio) / 2;
  const bottomHalf = (widthUnit * camera.roadBottomWidthRatio) / 2;
  const depthHeight = worldBottomY - horizonY;
  const widthGrowth = bottomHalf - topHalf;
  const widthExponent = camera.roadWidthDepthExponent;
  const depthToY = (depth) => horizonY + depthHeight * depth * depth;
  const depthAtY = (y) => Math.sqrt(Math.max(0, (y - horizonY) / depthHeight));
  const roadHalfWidthAt = (depth) => topHalf + widthGrowth * depth ** widthExponent;
  const depthAtRoadHalfWidth = (halfWidth) =>
    Math.max(0, (halfWidth - topHalf) / widthGrowth) ** (1 / widthExponent);
  const cameraDistance = (viewDistanceAhead * topHalf) / widthGrowth;
  const distanceAtDepth = (depth) =>
    cameraDistance * (bottomHalf / roadHalfWidthAt(depth) - 1);
  const depthAtDistance = (distance) => depthAtRoadHalfWidth(
    (bottomHalf * cameraDistance) / (cameraDistance + distance),
  );

  return {
    horizonY,
    centerX,
    widthUnit,
    viewDistanceAhead,
    depthToY,
    depthAtY,
    roadHalfWidthAt,
    depthAtRoadHalfWidth,
    distanceAtDepth,
    depthAtDistance,
    projectTrackObject: (relativeDistance, lateralRatio = 0, { maxDepth = 1 } = {}) => {
      if (
        relativeDistance > viewDistanceAhead ||
        relativeDistance <= -cameraDistance ||
        relativeDistance < distanceAtDepth(maxDepth)
      ) {
        return { visible: false, depth: 0, x: 0, y: 0, roadHalfWidth: 0 };
      }

      const depth = depthAtDistance(relativeDistance);
      const roadHalfWidth = roadHalfWidthAt(depth);
      return {
        visible: true,
        depth,
        x: centerX + roadHalfWidth * lateralRatio,
        y: depthToY(depth),
        roadHalfWidth,
      };
    },
  };
}
