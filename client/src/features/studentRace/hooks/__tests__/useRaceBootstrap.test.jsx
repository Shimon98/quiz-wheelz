import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useRaceBootstrap from "../useRaceBootstrap.js";
import useRacePlayerState from "../../../../shared/racePlayer/useRacePlayerState.js";
import useStudentRaceSynchronization from "../useStudentRaceSynchronization.js";
import { STUDENT_RACE_RESULTS_CONFIG } from "../../config/studentRaceResultsConfig.js";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig.js";
import { resultsRuntime } from "../../runtime/studentRaceResultsTestFixtures.js";

vi.mock("../../../../shared/racePlayer/useRacePlayerState.js", () => ({ default: vi.fn() }));
vi.mock("../useStudentRaceSynchronization.js", () => ({ default: vi.fn() }));

const WATCH_POLL_MS = STUDENT_RACE_RESULTS_CONFIG.watchPollMs;

let silentRefresh;

function mount({ resultsWatch, loaderError = null }) {
  useRacePlayerState.mockReturnValue({
    raceState: null,
    error: loaderError,
    isLoading: false,
    retry: vi.fn(),
    silentRefresh,
    authoritativeResync: vi.fn(),
  });
  useStudentRaceSynchronization.mockReturnValue({
    runtimeState: resultsRuntime(),
    resultsWatch,
    error: null,
    prepareAuthoritativeResync: vi.fn(),
  });

  return renderHook(() => useRaceBootstrap({ syncEnabled: false, finishSyncEnabled: true }));
}

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  silentRefresh = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useRaceBootstrap results-watch fallback", () => {
  it("refreshes race-state every five seconds while watching results, never at the gameplay cadence", () => {
    mount({ resultsWatch: true });

    advance(STUDENT_RACE_CONFIG.raceStatePollMs);
    expect(silentRefresh).not.toHaveBeenCalled();

    advance(WATCH_POLL_MS - STUDENT_RACE_CONFIG.raceStatePollMs);
    expect(silentRefresh).toHaveBeenCalledTimes(1);

    advance(WATCH_POLL_MS);
    expect(silentRefresh).toHaveBeenCalledTimes(2);
  });

  it("stops once results watching ends", () => {
    const { rerender } = mount({ resultsWatch: true });
    advance(WATCH_POLL_MS);

    useStudentRaceSynchronization.mockReturnValue({
      runtimeState: resultsRuntime({ raceStatus: "FINISHED", raceFinished: true }),
      resultsWatch: false,
      error: null,
      prepareAuthoritativeResync: vi.fn(),
    });
    rerender();
    advance(WATCH_POLL_MS * 4);

    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not poll after a session failure", () => {
    mount({ resultsWatch: true, loaderError: { category: "RACE_PLAYER_SESSION" } });

    advance(WATCH_POLL_MS * 4);

    expect(silentRefresh).not.toHaveBeenCalled();
  });
});
