import jungleBackgroundFar from "../../../assets/game/studentRace/backgrounds/jungle-background-far.webp";
import jungleGround from "../../../assets/game/studentRace/backgrounds/jungle-ground.webp";
import jungleMidBase from "../../../assets/game/studentRace/backgrounds/jungle-mid-base.webp";
import roadLoop from "../../../assets/game/studentRace/road/road-loop.webp";

export const STUDENT_RACE_WORLD_ART = Object.freeze({
  loading: Object.freeze({
    timeoutMs: 10000,
  }),
  sky: Object.freeze({
    topColor: 0x4a9fe2,
    horizonColor: 0xc2e7f4,
  }),
  far: Object.freeze({
    assetUrl: jungleBackgroundFar,
    widthScale: 1.22,
    openingXRatio: 0.5,
    horizonAnchorYRatio: 0.86,
  }),
  ground: Object.freeze({
    assetUrl: jungleGround,
    topColor: 0x9cc9bf,
    bottomColor: 0x1f4b3e,
    tileWorldLength: 710,
    tilesPerRoadWidth: 0.65,
    meshRows: 48,
    meshColumns: 8,
    maxAnisotropy: 16,
    mistMaxAlpha: 0.8,
    mistWorldHeightRatio: 0.35,
  }),
  midBase: Object.freeze({
    enabled: false,
    assetUrl: jungleMidBase,
    tileWorldLength: 480,
    heightRatio: 0.55,
    footInset: 0.03,
    lean: 0,
    rightPhaseOffset: 0.37,
    meshRows: 24,
    meshColumns: 3,
    maxAnisotropy: 16,
  }),
  road: Object.freeze({
    assetUrl: roadLoop,
    surfaceInsetURatio: 0.12,
    edgeFeatherHalfWidthRatio: 0.04,
    tileWorldLength: 960,
    meshRows: 48,
    meshColumns: 8,
    maxAnisotropy: 16,
    underPanelColor: 0xf99b35,
  }),
  horizonHaze: Object.freeze({
    color: 0xb5ded4,
    maxAlpha: 0.5,
    aboveWorldHeightRatio: 0.025,
    belowWorldHeightRatio: 0.09,
    radiusXRatio: 0.3,
  }),
});
