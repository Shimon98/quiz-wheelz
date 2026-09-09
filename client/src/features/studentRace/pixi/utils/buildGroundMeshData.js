import { buildProjectedStripMeshData } from "./buildProjectedStripMeshData";

export function buildGroundMeshData({
  perspective,
  frameWidth,
  worldBottomY,
  positionToPixelsRatio,
  tileWorldLength,
  tilesPerRoadWidth,
  rows,
  columns,
}) {
  return buildProjectedStripMeshData({
    rows,
    columns,
    edgesAt: (t) => {
      const y = t === 1 ? worldBottomY : perspective.depthToY(t);
      return { startX: 0, startY: y, endX: frameWidth, endY: y };
    },
    acrossAt: (t) => {
      const tilesPerPixel = tilesPerRoadWidth / (2 * perspective.roadHalfWidthAt(t));
      return {
        start: 0.5 - perspective.centerX * tilesPerPixel,
        end: 0.5 + (frameWidth - perspective.centerX) * tilesPerPixel,
      };
    },
    alongAt: (t) => (perspective.distanceAtDepth(t) * positionToPixelsRatio) / tileWorldLength,
    alongIsU: false,
  });
}
