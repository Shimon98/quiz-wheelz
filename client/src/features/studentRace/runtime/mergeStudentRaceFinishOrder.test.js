import { expect, it } from "vitest";
import { mergeStudentRaceFinishOrder } from "./mergeStudentRaceFinishOrder.js";
import { mapStudentRaceFinishArbitration } from "./mapStudentRaceFinishArbitration.js";
import { ApiContractError } from "../../../errors/ApiContractError.js";
import { raceSnapshot } from "./studentRaceTestFixtures.js";

const a = { racePlayerId: 1, finishedAtEpochMs: 1000, rank: 1 };
const b = { racePlayerId: 2, finishedAtEpochMs: 2000, rank: 2 };
const c = { racePlayerId: 3, finishedAtEpochMs: 2000, rank: 2 };
const proof = (confirmedFinishers) => ({ decidedAtEpochMs: 4000, eventVersion: 12,
  confirmedThroughEpochMs: 3000, confirmedFinishers });

it("accepts the first proof, extends a prefix and never shrinks it", () => {
  const first = proof([a]);
  const full = proof([a, b]);
  expect(mergeStudentRaceFinishOrder(null, first)).toBe(first);
  expect(mergeStudentRaceFinishOrder(first, full)).toBe(full);
  expect(mergeStudentRaceFinishOrder(full, first)).toBe(full);
});

it.each([
  [a, c], [a, { ...b, finishedAtEpochMs: 2500 }], [a, { ...b, rank: 3 }],
])("rejects contradictory confirmed identity/time/rank %#", (first, second) => {
  expect(() => mergeStudentRaceFinishOrder(proof([a, b]), proof([first, second]))).toThrow(ApiContractError);
});

it("preserves complete same-millisecond cohorts", () => {
  const tie = proof([a, { ...b, finishedAtEpochMs: 1000, rank: 1 }]);
  expect(mergeStudentRaceFinishOrder(tie, proof([a]))).toBe(tie);
  expect(() => mergeStudentRaceFinishOrder(proof([a]), tie)).toThrow(ApiContractError);
  expect(() => mergeStudentRaceFinishOrder(null, proof([a, { ...b, finishedAtEpochMs: 1000 }]))).toThrow(ApiContractError);
});

it.each([
  { raceId: 0 }, { finishOrder: proof([a, a]) },
  { finishOrder: { ...proof([a]), confirmedThroughEpochMs: null } },
  { finishOrder: { ...proof([a]), decidedAtEpochMs: 500 } },
  { snapshot: raceSnapshot({ eventVersion: null }) },
])("rejects malformed arbitration responses %#", (overrides) => {
  expect(() => mapStudentRaceFinishArbitration({ raceId: 7, snapshot: raceSnapshot(),
    finishOrder: proof([a]), ...overrides })).toThrow(ApiContractError);
});
