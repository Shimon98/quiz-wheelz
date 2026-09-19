import { expect, it } from "vitest";

import { resolveTeacherFeedRelativeTime } from "../resolveTeacherFeedRelativeTime";

const now = 1_755_600_100_000;

it.each([
  [now, { value: 0, unit: "second" }],
  [now + 4_000, { value: 0, unit: "second" }],
  [now - 8_000, { value: -8, unit: "second" }],
  [now - 59_999, { value: -59, unit: "second" }],
  [now - 60_000, { value: -1, unit: "minute" }],
  [now - 150_000, { value: -2, unit: "minute" }],
  [now - 3_600_000, { value: -1, unit: "hour" }],
])("resolves an event at %i relative to the server now", (occurredAt, expected) => {
  expect(resolveTeacherFeedRelativeTime(occurredAt, now)).toEqual(expected);
});

it("returns null without a server clock", () => {
  expect(resolveTeacherFeedRelativeTime(now, null)).toBeNull();
  expect(resolveTeacherFeedRelativeTime(null, now)).toBeNull();
});
