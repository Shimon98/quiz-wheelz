import { describe, expect, it } from "vitest";

import { projectSceneryPlacement } from "./projectSceneryPlacement";
import { createRacePerspective } from "./createRacePerspective";
import { STUDENT_RACE_SCENERY } from "../../config/sceneryConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "../../utils/resolveStudentRaceLayoutMetrics";

const VIEW_DISTANCE_AHEAD = 150;
const CENTER_X = 640;
const perspective = createRacePerspective({
  width: 1280,
  worldBottomY: 518,
  widthUnit: 400,
  camera: {
    horizonYRatio: 176 / 518,
    vanishingPointXRatio: 0.5,
    roadTopWidthRatio: 0.1,
    roadBottomWidthRatio: 1.75,
    roadWidthDepthExponent: 2,
  },
  viewDistanceAhead: VIEW_DISTANCE_AHEAD,
});

const band = {
  loopWorldLength: 14400,
  appearDepth: 0.1,
  fadeInDepth: 0.06,
  minRoadClearance: 1.02,
};

function options(worldOffset = 0, extra = {}) {
  return {
    worldOffset,
    perspective,
    positionToPixelsRatio: 30,
    band,
    widthPerRoadHalf: 0.7,
    aspectRatio: 367 / 512,
    frameWidth: 1280,
    frameHeight: 800,
    ...extra,
  };
}

function placementAtDepth(depth, extra = {}) {
  return {
    prop: "TREE_01",
    side: -1,
    worldPosition: perspective.distanceAtDepth(depth) * 30,
    lateralRatio: 1.5,
    scale: 1,
    flip: false,
    ...extra,
  };
}

describe("projectSceneryPlacement", () => {
  it("keeps ground position and scale locked to road perspective", () => {
    const result = projectSceneryPlacement(placementAtDepth(0.5), options());

    expect(result.visible).toBe(true);
    expect(result.depth).toBeCloseTo(0.5);
    expect(result.roadHalfWidth).toBeCloseTo(102.5);
    expect(result.x).toBeCloseTo(CENTER_X - 102.5 * 1.5);
    expect(result.width).toBeCloseTo(102.5 * 0.7);
    expect(result.height / result.width).toBeCloseTo(512 / 367);
    expect(result.alpha).toBe(1);
  });

  it("hides objects outside the world window and repeats at the same loop offset", () => {
    const tree = placementAtDepth(0.5);

    expect(projectSceneryPlacement(tree, options(5000)).visible).toBe(false);
    expect(projectSceneryPlacement(tree, options(tree.worldPosition - 4600)).visible).toBe(false);
    const repeated = projectSceneryPlacement(tree, options(14400));
    const initial = projectSceneryPlacement(tree, options());
    expect(repeated.visible).toBe(initial.visible);
    ["x", "y", "width", "height", "alpha"].forEach((key) => {
      expect(repeated[key]).toBeCloseTo(initial[key]);
    });
  });

  it("continues through MID into NEAR without changing the movement rate", () => {
    const tree = placementAtDepth(0.65);
    const mid = projectSceneryPlacement(tree, options());
    const travelled = (perspective.distanceAtDepth(0.65) - perspective.distanceAtDepth(0.85)) * 30;
    const near = projectSceneryPlacement(tree, options(travelled));

    expect(near.visible).toBe(true);
    expect(near.depth).toBeCloseTo(0.85);
    expect(near.alpha).toBe(1);
    expect(near.y).toBeGreaterThan(mid.y);
    expect(near.width).toBeGreaterThan(mid.width);
  });

  it("fades near the horizon without fading at the question panel", () => {
    expect(projectSceneryPlacement(placementAtDepth(0.05), options()).visible).toBe(false);
    expect(projectSceneryPlacement(placementAtDepth(0.13), options()).alpha).toBeCloseTo(0.5);
    expect(projectSceneryPlacement(placementAtDepth(0.8), options()).alpha).toBe(1);
    expect(projectSceneryPlacement(placementAtDepth(0.98), options()).alpha).toBe(1);
    expect(projectSceneryPlacement(placementAtDepth(1), options()).alpha).toBe(1);
  });

  it("keeps the same sprite continuous after its ground anchor passes the panel", () => {
    const tree = placementAtDepth(0.999);
    const before = projectSceneryPlacement(tree, options());
    const travelled = (perspective.distanceAtDepth(0.999) - perspective.distanceAtDepth(1.001)) * 30;
    const after = projectSceneryPlacement(tree, options(travelled));

    expect(before.visible).toBe(true);
    expect(after.visible).toBe(true);
    expect(after.depth).toBeCloseTo(1.001);
    expect(after.y).toBeGreaterThan(518);
    expect(after.y - before.y).toBeLessThan(2);
    expect(after.width).toBeGreaterThan(before.width);
    expect(after.alpha).toBe(1);
  });

  it("retains the top of foliage whose base has passed the canvas bottom", () => {
    const result = projectSceneryPlacement(
      placementAtDepth(1.352, { lateralRatio: 1.1 }),
      options(),
    );

    expect(result.visible).toBe(true);
    expect(result.y).toBeGreaterThan(800);
    expect(result.y - result.height).toBeLessThan(800);
    expect(result.alpha).toBe(1);
  });

  it("recycles only after the complete silhouette clears the viewport", () => {
    const tree = placementAtDepth(1);
    const widthRatio = 0.7;
    const innerRatio = tree.lateralRatio - widthRatio / 2;
    const exitDepth = perspective.depthAtRoadHalfWidth(CENTER_X / innerRatio);
    const exitOffset = -perspective.distanceAtDepth(exitDepth) * 30;
    const beforeExit = projectSceneryPlacement(tree, options(exitOffset - 1));
    const afterExit = projectSceneryPlacement(tree, options(exitOffset + 1));
    const recycled = projectSceneryPlacement(tree, options(exitOffset + 40));

    expect(beforeExit.visible).toBe(true);
    expect(beforeExit.alpha).toBe(1);
    expect(beforeExit.x + beforeExit.width / 2).toBeGreaterThan(0);
    expect(afterExit.visible).toBe(false);
    expect(recycled.visible).toBe(false);
  });

  it("keeps enlarged tree crowns outside the corridor using their full width", () => {
    const result = projectSceneryPlacement(
      placementAtDepth(0.7, { scale: 2.5, lateralRatio: 1.1 }),
      options(),
    );
    const innerEdge = result.x + result.width / 2;

    expect(result.visible).toBe(true);
    expect(innerEdge).toBeCloseTo(CENTER_X - result.roadHalfWidth * band.minRoadClearance);
    expect(result.width).toBeCloseTo(result.roadHalfWidth * 0.7 * 2.5);
  });

  it("allows low verge leaves to cover the shoulder without entering the center", () => {
    const result = projectSceneryPlacement(
      placementAtDepth(0.7, { lateralRatio: 1.05 }),
      options(0, { band: { ...band, minRoadClearance: 0.88 } }),
    );
    const innerEdge = result.x + result.width / 2;
    const roadEdge = CENTER_X - result.roadHalfWidth;

    expect(innerEdge).toBeGreaterThan(roadEdge);
    expect(innerEdge).toBeCloseTo(CENTER_X - result.roadHalfWidth * 0.88);
  });

  it("retains a partially visible canopy after its anchor leaves the screen", () => {
    const partial = projectSceneryPlacement(
      placementAtDepth(0.8, { lateralRatio: 3 }),
      options(),
    );
    const outside = projectSceneryPlacement(
      placementAtDepth(0.8, { lateralRatio: 4 }),
      options(),
    );

    expect(partial.x).toBeLessThan(0);
    expect(partial.x + partial.width / 2).toBeGreaterThan(0);
    expect(partial.visible).toBe(true);
    expect(outside.visible).toBe(false);
  });

  it("mirrors ground positions while retaining equal size and depth", () => {
    const left = projectSceneryPlacement(placementAtDepth(0.7), options());
    const right = projectSceneryPlacement(placementAtDepth(0.7, { side: 1 }), options());

    expect(CENTER_X - left.x).toBeCloseTo(right.x - CENTER_X);
    expect(left.width).toBe(right.width);
    expect(left.depth).toBe(right.depth);
  });

  it("reuses a shorter band loop only after the silhouette exits and fades it into the distance", () => {
    const tree = placementAtDepth(1);
    const shortBand = { ...band, loopWorldLength: 2400 };
    const innerRatio = tree.lateralRatio - 0.7 / 2;
    const exitDepth = perspective.depthAtRoadHalfWidth((CENTER_X + 1) / innerRatio);
    const exitOffset = -perspective.distanceAtDepth(exitDepth) * 30;
    const beforeExit = projectSceneryPlacement(tree, options(exitOffset - 2, { band: shortBand }));
    const afterExit = projectSceneryPlacement(tree, options(exitOffset + 0.001, { band: shortBand }));

    expect(beforeExit.visible).toBe(true);
    expect(beforeExit.alpha).toBe(1);
    expect(afterExit.alpha).toBeLessThan(0.001);
    expect(projectSceneryPlacement(tree, options(2400, { band: shortBand })).depth).toBeCloseTo(1);
  });

  it.each([[360, 640], [430, 932], [960, 1366], [736, 800], [441.6, 480]])(
    "clears every configured silhouette before its loop recycles at %s by %s",
    (width, height) => {
      const { world } = resolveStudentRaceLayoutMetrics({ width, height });
      const projection = createRacePerspective({
        width,
        worldBottomY: world.bottomY,
        widthUnit: world.widthUnit,
        camera: STUDENT_RACE_VISUAL_CONFIG.camera,
        viewDistanceAhead: VIEW_DISTANCE_AHEAD,
      });
      const { placements, props, bands } = STUDENT_RACE_SCENERY;

      placements.forEach((placement) => {
        const widthRatio = props[placement.prop].widthPerRoadHalf * placement.scale;
        const innerRatio = Math.max(
          placement.lateralRatio - widthRatio / 2,
          bands[placement.band].minRoadClearance,
        );
        const exitDepth = Math.max(
          1,
          projection.depthAtRoadHalfWidth((width / 2 + 1) / innerRatio),
        );

        expect(projection.roadHalfWidthAt(exitDepth) * innerRatio).toBeGreaterThan(width / 2);
        expect(-projection.distanceAtDepth(exitDepth) * 30).toBeLessThan(bands[placement.band].loopWorldLength);
      });
    },
  );
});
