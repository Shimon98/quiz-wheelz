import { buildProjectedStripMeshData } from "./buildProjectedStripMeshData";

export function buildRoadMeshData({
  perspective,
  worldBottomY,
  positionToPixelsRatio,
  tileWorldLength,
  rows,
  columns = 1,
  surfaceInsetURatio = 0,
}) {
  const data = buildProjectedStripMeshData({
    rows,
    columns,
    edgesAt: (t) => {
      const y = t === 1 ? worldBottomY : perspective.depthToY(t);
      const halfWidth = perspective.roadHalfWidthAt(t);
      return {
        startX: perspective.centerX - halfWidth,
        startY: y,
        endX: perspective.centerX + halfWidth,
        endY: y,
      };
    },
    alongAt: (t) => (perspective.distanceAtDepth(t) * positionToPixelsRatio) / tileWorldLength,
    acrossAt: () => ({ start: surfaceInsetURatio, end: 1 - surfaceInsetURatio }),
    alongIsU: false,
  });

  return { ...data, baseV: data.baseAlong };
}
