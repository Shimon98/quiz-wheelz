import { expect, it } from "vitest";

import { formatElapsedClock } from "../formatElapsedClock";

it.each([
  [null, null],
  [undefined, null],
  [Number.NaN, null],
  [-5000, "00:00"],
  [0, "00:00"],
  [7_400, "00:07"],
  [222_000, "03:42"],
  [3_499_000, "58:19"],
  [3_912_000, "1:05:12"],
  [36_000_000, "10:00:00"],
])("formats %s as %s", (elapsedMs, expected) => {
  expect(formatElapsedClock(elapsedMs)).toBe(expected);
});
