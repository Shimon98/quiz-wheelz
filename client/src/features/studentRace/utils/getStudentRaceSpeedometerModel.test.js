import { describe, expect, it } from "vitest";

import { getStudentRaceSpeedometerModel } from "./getStudentRaceSpeedometerModel";

describe("getStudentRaceSpeedometerModel", () => {
  it.each([undefined, null, NaN, Infinity, -Infinity, -0.1, "0.7"])(
    "does not invent a dial value for invalid speed %s", (speed) => {
      expect(getStudentRaceSpeedometerModel(speed)).toBeNull();
    },
  );

  it("preserves a stationary speed of zero", () => {
    expect(getStudentRaceSpeedometerModel(0)).toEqual({
      valueText: "×0.0",
      needleStyle: { transform: "rotate(0deg)" },
      arcStyle: { strokeDashoffset: 100 },
    });
  });

  it("shows the authoritative multiplier with a cosmetic midpoint", () => {
    const model = getStudentRaceSpeedometerModel(0.7);
    expect(model.valueText).toBe("×0.7");
    expect(model.needleStyle.transform).toBe(`rotate(${0.7 / 1.7 * 180}deg)`);
    expect(model.arcStyle.strokeDashoffset).toBeCloseTo(100 / 1.7);
    expect(getStudentRaceSpeedometerModel(1).needleStyle.transform).toBe("rotate(90deg)");
  });

  it("does not clamp higher authoritative speeds to an assumed server maximum", () => {
    const values = [0.5, 0.7, 1, 2, 5, 20].map(getStudentRaceSpeedometerModel);
    expect(values.at(-1).valueText).toBe("×20.0");
    values.slice(1).forEach((model, index) => {
      expect(model.arcStyle.strokeDashoffset).toBeLessThan(values[index].arcStyle.strokeDashoffset);
      expect(model.arcStyle.strokeDashoffset).toBeGreaterThan(0);
    });
  });
});
