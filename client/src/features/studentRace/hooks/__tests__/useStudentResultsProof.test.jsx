import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useStudentResultsProof from "../useStudentResultsProof.js";
import { resolveResultsProofDelayMs } from "../../utils/resultsProofSchedule.js";
import {
  resultsFinishOrder,
  resultsOpponent,
  resultsRuntime,
} from "../../runtime/studentRaceResultsTestFixtures.js";

const OWN_ID = 1;
const delay = (attempt) => resolveResultsProofDelayMs(attempt, OWN_ID);

let request;

function props(overrides = {}) {
  return {
    enabled: true,
    runtimeState: resultsRuntime(),
    finishOrder: null,
    requestFinishArbitration: request,
    ...overrides,
  };
}

function mount(overrides) {
  return renderHook((current) => useStudentResultsProof(current), { initialProps: props(overrides) });
}

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  request = vi.fn().mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStudentResultsProof", () => {
  it.each([
    ["no finisher is waiting for proof", { finishOrder: resultsFinishOrder([1, 1], [2, 2], [3, 3]) }],
    ["the race is already final", { runtimeState: resultsRuntime({ raceStatus: "FINISHED", raceFinished: true }) }],
    ["passive requests are not allowed", { enabled: false }],
  ])("never asks when %s", async (_label, overrides) => {
    mount(overrides);

    await advance(120_000);

    expect(request).not.toHaveBeenCalled();
  });

  it("asks only after the student's deterministic staggered delay", async () => {
    mount();

    await advance(delay(0) - 1);
    expect(request).not.toHaveBeenCalled();

    await advance(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("backs off 1.5, 3, 6, 12 and then 15 seconds while the same finishers stay unproven", async () => {
    mount();

    for (const attempt of [0, 1, 2, 3, 4, 5]) {
      await advance(delay(attempt) - 1);
      expect(request).toHaveBeenCalledTimes(attempt);
      await advance(1);
      expect(request).toHaveBeenCalledTimes(attempt + 1);
    }

    expect(delay(5)).toBe(delay(4));
  });

  it("restarts from the first delay when a new finisher appears", async () => {
    const { rerender } = mount();
    await advance(delay(0) + delay(1) + delay(2));
    expect(request).toHaveBeenCalledTimes(3);

    rerender(props({
      runtimeState: resultsRuntime({
        opponents: [
          resultsOpponent(2, "FINISHED", 2),
          resultsOpponent(3, "FINISHED", 3),
          resultsOpponent(4, "FINISHED", 4),
          resultsOpponent(5, "DISCONNECTED", 5),
        ],
      }),
    }));
    await advance(delay(0));

    expect(request).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["the proof catches up", { finishOrder: resultsFinishOrder([1, 1], [2, 2], [3, 3]) }],
    ["the race finishes", { runtimeState: resultsRuntime({ raceStatus: "FINISHED", raceFinished: true }) }],
    ["passive requests stop", { enabled: false }],
  ])("cancels the scheduled proof when %s", async (_label, overrides) => {
    const { rerender } = mount();
    await advance(delay(0));

    rerender(props(overrides));
    await advance(120_000);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("cancels the scheduled proof on unmount", async () => {
    const { unmount } = mount();

    unmount();
    await advance(120_000);

    expect(request).not.toHaveBeenCalled();
  });

  it("never starts a second request while the first one is still in flight", async () => {
    request.mockReturnValue(new Promise(() => {}));
    mount();

    await advance(delay(0) + 120_000);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("does not let a late answer from a cancelled cycle schedule anything", async () => {
    let answer;
    request.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));
    const { rerender } = mount();
    await advance(delay(0));

    rerender(props({ finishOrder: resultsFinishOrder([1, 1], [2, 2], [3, 3]) }));
    await act(async () => {
      answer(null);
    });
    await advance(120_000);

    expect(request).toHaveBeenCalledTimes(1);
  });
});
