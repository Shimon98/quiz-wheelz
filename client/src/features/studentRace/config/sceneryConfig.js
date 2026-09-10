import bush01 from "../../../assets/game/studentRace/scenery/bush-01.webp";
import thicket01 from "../../../assets/game/studentRace/scenery/jungle-thicket-01.webp";
import vergeFlowers01 from "../../../assets/game/studentRace/scenery/jungle-verge-flowers-01.webp";
import palm01 from "../../../assets/game/studentRace/scenery/palm-01.webp";
import rock01 from "../../../assets/game/studentRace/scenery/rock-01.webp";
import rock02 from "../../../assets/game/studentRace/scenery/rock-02.webp";
import tree01 from "../../../assets/game/studentRace/scenery/tree-01.webp";
import tree02 from "../../../assets/game/studentRace/scenery/tree-02.webp";
import { buildSceneryPlacements } from "../pixi/utils/buildSceneryPlacements";

const bands = Object.freeze({
  thicket: Object.freeze({
    loopWorldLength: 4800,
    countPerSide: 44,
    props: ["THICKET_01"],
    lateralRange: [2.1, 3.3],
    scaleRange: [1.65, 2.6],
    minRoadClearance: 1.08,
    appearDepth: 0,
    fadeInDepth: 0.32,
    tint: 0xb4cdc3,
    seed: 31,
  }),
  canopy: Object.freeze({
    loopWorldLength: 3600,
    countPerSide: 32,
    props: ["TREE_01", "TREE_02", "TREE_01"],
    lateralRange: [1.9, 3.7],
    scaleRange: [1.7, 2.65],
    minRoadClearance: 1.06,
    appearDepth: 0.05,
    fadeInDepth: 0.22,
    tint: 0xc5d9b8,
    seed: 3,
  }),
  trees: Object.freeze({
    loopWorldLength: 3000,
    countPerSide: 28,
    props: ["TREE_01", "PALM_01", "TREE_02", "TREE_01"],
    lateralRange: [1.45, 2.3],
    scaleRange: [1.05, 1.8],
    minRoadClearance: 1.02,
    appearDepth: 0.07,
    fadeInDepth: 0.18,
    tint: 0xffffff,
    seed: 7,
  }),
  undergrowth: Object.freeze({
    loopWorldLength: 2700,
    countPerSide: 44,
    props: ["BUSH_01", "VERGE_FLOWERS_01", "PALM_01", "BUSH_01", "TREE_02"],
    lateralRange: [1.3, 2.1],
    scaleRange: [0.7, 1.45],
    minRoadClearance: 1.04,
    appearDepth: 0.12,
    fadeInDepth: 0.12,
    tint: 0xe0edc9,
    seed: 13,
  }),
  rocks: Object.freeze({
    loopWorldLength: 4800,
    countPerSide: 18,
    props: ["ROCK_01", "ROCK_02"],
    lateralRange: [1.12, 1.55],
    scaleRange: [0.8, 1.5],
    minRoadClearance: 1.01,
    appearDepth: 0.14,
    fadeInDepth: 0.07,
    tint: 0xffffff,
    seed: 19,
  }),
  verge: Object.freeze({
    loopWorldLength: 2400,
    countPerSide: 128,
    props: ["BUSH_01", "VERGE_FLOWERS_01", "BUSH_01"],
    lateralRange: [0.98, 1.22],
    scaleRange: [0.62, 1.12],
    minRoadClearance: 0.74,
    appearDepth: 0.02,
    fadeInDepth: 0.12,
    tint: 0xffffff,
    seed: 23,
  }),
});

export const STUDENT_RACE_SCENERY = Object.freeze({
  bands,
  props: Object.freeze({
    VERGE_FLOWERS_01: Object.freeze({
      assetUrl: vergeFlowers01,
      widthPerRoadHalf: 0.72,
      anchorY: 0.94,
    }),
    THICKET_01: Object.freeze({ assetUrl: thicket01, widthPerRoadHalf: 1.15 }),
    TREE_01: Object.freeze({ assetUrl: tree01, widthPerRoadHalf: 0.82 }),
    TREE_02: Object.freeze({ assetUrl: tree02, widthPerRoadHalf: 0.6 }),
    PALM_01: Object.freeze({ assetUrl: palm01, widthPerRoadHalf: 0.78 }),
    ROCK_01: Object.freeze({ assetUrl: rock01, widthPerRoadHalf: 0.36 }),
    ROCK_02: Object.freeze({ assetUrl: rock02, widthPerRoadHalf: 0.42 }),
    BUSH_01: Object.freeze({ assetUrl: bush01, widthPerRoadHalf: 0.64 }),
  }),
  placements: buildSceneryPlacements({ bands }),
});
