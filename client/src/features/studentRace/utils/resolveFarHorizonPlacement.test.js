import { describe, expect, it } from "vitest";

import { STUDENT_RACE_WORLD_ART } from "../config/worldArtConfig";
import { resolveFarHorizonPlacement } from "./resolveFarHorizonPlacement";

const TEXTURE = { textureWidth: 1672, textureHeight: 941 };

function place(frameWidth, horizonY) {
  return resolveFarHorizonPlacement({
    centerX: frameWidth / 2,
    frameWidth,
    horizonY,
    ...TEXTURE,
    farConfig: STUDENT_RACE_WORLD_ART.far,
  });
}

describe("resolveFarHorizonPlacement", () => {
  it.each([
    [360, 122],
    [390, 190],
    [520, 176],
  ])("aligns the valley opening with the vanishing point at width %s", (width, horizonY) => {
    const placement = place(width, horizonY);

    expect(
      placement.x + placement.width * STUDENT_RACE_WORLD_ART.far.openingXRatio,
    ).toBeCloseTo(width / 2);
    expect(placement.width).toBeCloseTo(
      width * STUDENT_RACE_WORLD_ART.far.widthScale,
    );
  });

  it("anchors the configured source row to the horizon and follows resize", () => {
    const before = place(520, 176);
    expect(
      before.y + before.height * STUDENT_RACE_WORLD_ART.far.horizonAnchorYRatio,
    ).toBeCloseTo(176);

    const after = place(360, 122);
    expect(
      after.y + after.height * STUDENT_RACE_WORLD_ART.far.horizonAnchorYRatio,
    ).toBeCloseTo(122);
    expect(after.width).not.toBeCloseTo(before.width);
  });
});
