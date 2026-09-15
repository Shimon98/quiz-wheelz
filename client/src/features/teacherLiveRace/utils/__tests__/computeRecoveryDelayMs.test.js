import { expect, it } from "vitest";

import { computeRecoveryDelayMs } from "../computeRecoveryDelayMs";

const config = { initialDelayMs: 1000, factor: 2, maxDelayMs: 15000, jitterMs: 300 };

it("doubles per attempt, caps at the maximum and adds bounded jitter", () => {
  expect(computeRecoveryDelayMs(0, config, 0)).toBe(1000);
  expect(computeRecoveryDelayMs(1, config, 0)).toBe(2000);
  expect(computeRecoveryDelayMs(3, config, 0.5)).toBe(8150);
  expect(computeRecoveryDelayMs(10, config, 1)).toBe(15300);
});
