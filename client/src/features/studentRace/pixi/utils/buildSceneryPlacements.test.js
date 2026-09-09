import { describe, expect, it } from "vitest";

import { STUDENT_RACE_SCENERY } from "../../config/sceneryConfig";
import { buildSceneryPlacements } from "./buildSceneryPlacements";

describe("buildSceneryPlacements", () => {
  it("builds a bounded stable population with valid asset references", () => {
    const { placements, props, bands } = STUDENT_RACE_SCENERY;

    expect(buildSceneryPlacements(STUDENT_RACE_SCENERY)).toEqual(placements);
    expect(placements.length).toBeLessThanOrEqual(600);
    expect(new Set(placements.map(({ id }) => id)).size).toBe(placements.length);
    placements.forEach(({ prop, band, worldPosition, scale }) => {
      expect(props[prop]).toBeDefined();
      expect(worldPosition).toBeGreaterThanOrEqual(0);
      expect(worldPosition).toBeLessThan(bands[band].loopWorldLength);
      expect(scale).toBeGreaterThan(0);
    });
  });

  it("covers both shoulders throughout the loop without a sparse or wrap gap", () => {
    const { placements, bands } = STUDENT_RACE_SCENERY;
    const { loopWorldLength } = bands.verge;

    [-1, 1].forEach((side) => {
      const positions = placements
        .filter((placement) => placement.band === "verge" && placement.side === side)
        .map(({ worldPosition }) => worldPosition)
        .sort((a, b) => a - b);
      positions.forEach((position, index) => {
        const next = positions[index + 1] ?? positions[0] + loopWorldLength;
        expect(next - position).toBeLessThan(35);
        expect(next - position).toBeGreaterThan(0);
      });
    });
  });

  it("varies height and lateral depth on both sides without symmetric rows", () => {
    const { placements } = STUDENT_RACE_SCENERY;
    const canopy = placements.filter(({ band }) => band === "canopy");
    const trees = placements.filter(({ band }) => band === "trees");

    expect(Math.max(...canopy.map(({ scale }) => scale))).toBeGreaterThan(2.5);
    expect(Math.min(...trees.map(({ scale }) => scale))).toBeLessThan(1.2);
    expect(new Set(canopy.map(({ lateralRatio }) => lateralRatio)).size).toBeGreaterThan(5);

    const left = canopy.filter(({ side }) => side < 0);
    const right = canopy.filter(({ side }) => side > 0);
    expect(left.map(({ worldPosition }) => worldPosition)).not.toEqual(
      right.map(({ worldPosition }) => worldPosition),
    );
  });
});
