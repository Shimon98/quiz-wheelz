import { describe, expect, it } from "vitest";

import { LUCK_EFFECT_ART, STUDENT_RACE_EFFECT_ART } from "../studentRaceEffectManifest";

describe("studentRaceEffectManifest", () => {
  it("reserves the six Luck art slots, each empty or holding an approved file", () => {
    expect(Object.keys(LUCK_EFFECT_ART))
      .toEqual(["energyOrb", "shieldGlint", "windLeaf", "mudSplash", "mudDrop", "shieldImpact"]);
    Object.values(LUCK_EFFECT_ART).forEach(({ url }) => expect(url === null || typeof url === "string").toBe(true));
  });

  it("says how much of its square the painted orb fills, and where the splash and the flare are pinned", () => {
    const { energyOrb, mudSplash, shieldImpact } = LUCK_EFFECT_ART;

    expect(energyOrb.cover).toBeGreaterThan(0.5);
    expect(energyOrb.cover).toBeLessThanOrEqual(1);
    [mudSplash.anchorX, mudSplash.anchorY, shieldImpact.anchorX, shieldImpact.anchorY].forEach((anchor) => {
      expect(anchor).toBeGreaterThanOrEqual(0);
      expect(anchor).toBeLessThanOrEqual(1);
    });
  });

  it("keeps the Turbo exhaust art as it was", () => {
    expect(STUDENT_RACE_EFFECT_ART.turboExhaust)
      .toMatchObject({ anchorX: 0.5, anchorY: 0.08, widthRadii: 2.6, heightRadii: 3.8 });
    expect(STUDENT_RACE_EFFECT_ART.turboExhaust.url).toEqual(expect.stringContaining("turbo-exhaust-painted"));
  });
});
