import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useStudentRaceSynchronization from "../useStudentRaceSynchronization.js";
import { raceResponse, raceSnapshot } from "../../runtime/studentRaceTestFixtures.js";
import { createStudentRaceEventSource, requestFinishArbitration } from "../../../../api/studentRaceLiveApi.js";

vi.mock("../../../../api/studentRaceLiveApi.js", () => ({
  createStudentRaceEventSource: vi.fn(() => ({ close: vi.fn() })),
  requestFinishArbitration: vi.fn(),
}));

const FINISHED_WHILE_RACING = Object.freeze({
  eventVersion: 13,
  playerFinished: true,
  playerStatus: "FINISHED",
  position: 1000,
  movementUnitsPerSecond: 0,
});

let silentRefresh;

beforeEach(() => {
  vi.clearAllMocks();
  silentRefresh = vi.fn().mockResolvedValue(undefined);
});

async function mountPlaying() {
  const hook = renderHook((props) => useStudentRaceSynchronization({ silentRefresh, ...props }), {
    initialProps: { raceState: raceResponse(), syncEnabled: true },
  });
  await act(async () => {});
  return hook;
}

async function finishWhileRaceRuns({ result, rerender }) {
  act(() => {
    result.current.applyAuthoritativeSnapshot(raceSnapshot(FINISHED_WHILE_RACING));
  });
  rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
  await act(async () => {});
}

async function signals(result, events) {
  await act(async () => {
    for (const [version, type] of events) {
      result.current.observeSignal({ version, type, occurredAtEpochMs: 10000 });
    }
  });
}

function openedSources() {
  return createStudentRaceEventSource.mock.results.map((entry) => entry.value);
}

describe("student synchronization while watching results", () => {
  it("is not in results-watch mode while playing", async () => {
    const { result } = await mountPlaying();

    expect(result.current.resultsWatch).toBe(false);
  });

  it("keeps the same stream open, without reconnecting, once I finish while the race runs", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    expect(hook.result.current.resultsWatch).toBe(true);
    expect(createStudentRaceEventSource).toHaveBeenCalledTimes(1);
    expect(openedSources()[0].close).not.toHaveBeenCalled();
  });

  it("refreshes race-state for finish signals and ignores answer and progress signals", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    await signals(hook.result, [[14, "QUESTION_ANSWERED"], [15, "PLAYER_PROGRESS_UPDATED"]]);
    expect(silentRefresh).not.toHaveBeenCalled();

    await signals(hook.result, [[16, "PLAYER_FINISHED"]]);
    expect(silentRefresh).toHaveBeenCalledTimes(1);

    await signals(hook.result, [[17, "RACE_FINISHED"]]);
    expect(silentRefresh).toHaveBeenCalledTimes(2);
  });

  it("never turns a progress event into another arbitration or refresh", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    await signals(hook.result, [[14, "PLAYER_PROGRESS_UPDATED"], [15, "PLAYER_PROGRESS_UPDATED"]]);

    expect(silentRefresh).not.toHaveBeenCalled();
    expect(requestFinishArbitration).not.toHaveBeenCalled();
  });

  it("recovers a version gap through the existing refresh path", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    await signals(hook.result, [[20, "PLAYER_PROGRESS_UPDATED"]]);

    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("closes the stream once the whole race is final", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    act(() => {
      hook.result.current.applyAuthoritativeSnapshot(raceSnapshot({ ...FINISHED_WHILE_RACING, eventVersion: 14,
        raceStatus: "FINISHED", raceFinished: true }));
    });
    await act(async () => {});

    expect(hook.result.current.resultsWatch).toBe(false);
    expect(openedSources()[0].close).toHaveBeenCalled();
  });

  it("pauses while passive requests are unavailable and reopens from the last version afterwards", async () => {
    const hook = await mountPlaying();
    await finishWhileRaceRuns(hook);

    hook.rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: false });
    await act(async () => {});
    expect(hook.result.current.resultsWatch).toBe(false);
    expect(openedSources()[0].close).toHaveBeenCalled();

    hook.rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
    await act(async () => {});
    expect(hook.result.current.resultsWatch).toBe(true);
    expect(createStudentRaceEventSource).toHaveBeenLastCalledWith(13);
  });

  it("does not watch results for a student who left before finishing", async () => {
    const hook = await mountPlaying();

    act(() => {
      hook.result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 13, playerStatus: "DISCONNECTED" }));
    });
    hook.rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
    await act(async () => {});

    expect(hook.result.current.resultsWatch).toBe(false);
    expect(openedSources()[0].close).toHaveBeenCalled();
  });
});
