const PERCENT_SCALE = 100;

export function resolveRaceResultsStageGeometry({ podiumToKartWidth, kart, podium }) {
  const kartWidth = 1 / podiumToKartWidth;
  const kartHeight = kartWidth / kart.aspectRatio;
  const podiumHeight = 1 / podium.aspectRatio;
  const kartTop = podium.surfaceCenterY * podiumHeight - kart.padBottomY * kartHeight;
  const kartOverhang = Math.max(0, -kartTop);
  const stageHeight = Math.max(podiumHeight, kartTop + kartHeight) + kartOverhang;

  return Object.freeze({
    stageAspectRatio: 1 / stageHeight,
    kartWidthPercent: kartWidth * PERCENT_SCALE,
    kartTopPercent: ((kartTop + kartOverhang) / stageHeight) * PERCENT_SCALE,
    podiumTopPercent: (kartOverhang / stageHeight) * PERCENT_SCALE,
  });
}
