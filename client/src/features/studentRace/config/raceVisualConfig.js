export const STUDENT_RACE_VISUAL_CONFIG = Object.freeze({
  gameFrame: Object.freeze({
    maxWidth: 960,
    maxHeightRatio: 0.92,
    minHeight: 640,
  }),
  playerKart: Object.freeze({
    screenXRatio: 0.5,
    maxWidthRatio: 0.34,
  }),
  camera: Object.freeze({
    horizonYRatio: 0.34,
    vanishingPointXRatio: 0.5,
    roadTopWidthRatio: 0.09,
    roadBottomWidthRatio: 1.65,
    roadWidthDepthExponent: 2,
    widthUnitWorldHeightRatio: 0.7,
  }),
  road: Object.freeze({
    curbSegmentCount: 14,
    mudDetailCount: 15,
  }),
  viewDepthZones: Object.freeze({
    far: Object.freeze({ minDepth: 0, maxDepth: 0.35 }),
    mid: Object.freeze({ minDepth: 0.35, maxDepth: 0.7 }),
    near: Object.freeze({ minDepth: 0.7, maxDepth: 1 }),
  }),
  layout: Object.freeze({
    questionPanel: Object.freeze({
      heightRatio: 0.36,
      minHeight: 300,
      maxHeight: 380,
      sideInset: 12,
      topOverlap: 18,
    }),
    hud: Object.freeze({
      topInset: 12,
      sideInset: 12,
      minHeight: 72,
    }),
    world: Object.freeze({
      playerKartAnchorYRatio: 0.82,
    }),
  }),
});
