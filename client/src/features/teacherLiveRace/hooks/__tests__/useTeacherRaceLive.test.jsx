import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useTeacherRaceLive from "../useTeacherRaceLive";
import { getTeacherRaceLiveState } from "../../../../api/teacherRaceLiveApi";
import { teacherLiveStateResponse } from "../../runtime/teacherRaceLiveTestFixtures";
import { ERROR_CATEGORIES } from "../../../../errors/errorCategories";

vi.mock("../../../../api/teacherRaceLiveApi", () => ({
  getTeacherRaceLiveState: vi.fn(),
  createTeacherRaceEventSource: vi.fn(() => ({ readyState: 0, close: vi.fn() })),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function notFoundFailure() {
  return { response: { status: 404, data: { error: "RACE_NOT_FOUND", code: 3004 } } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTeacherRaceLive", () => {
  it("loads, validates and exposes the runtime for the routed race", async () => {
    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse());

    const { result } = renderHook(() => useTeacherRaceLive("7"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.runtime).toBeNull();

    await act(async () => {});

    expect(getTeacherRaceLiveState).toHaveBeenCalledExactlyOnceWith("7");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.runtime.race.raceId).toBe(7);
    expect(result.current.runtime.players).toHaveLength(2);
  });

  it("surfaces an API failure as a normalized error", async () => {
    getTeacherRaceLiveState.mockRejectedValue(notFoundFailure());

    const { result } = renderHook(() => useTeacherRaceLive("7"));
    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.runtime).toBeNull();
    expect(result.current.error.category).toBe(ERROR_CATEGORIES.NOT_FOUND);
    expect(result.current.error.errorName).toBe("RACE_NOT_FOUND");
  });

  it("surfaces a malformed contract as an API_CONTRACT error", async () => {
    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse({ eventVersion: -1 }));

    const { result } = renderHook(() => useTeacherRaceLive("7"));
    await act(async () => {});

    expect(result.current.runtime).toBeNull();
    expect(result.current.error.category).toBe(ERROR_CATEGORIES.API_CONTRACT);
  });

  it("retries after a failure and clears the old error while loading", async () => {
    getTeacherRaceLiveState
      .mockRejectedValueOnce(notFoundFailure())
      .mockResolvedValueOnce(teacherLiveStateResponse());

    const { result } = renderHook(() => useTeacherRaceLive("7"));
    await act(async () => {});
    expect(result.current.error).not.toBeNull();

    act(() => result.current.retry());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {});

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.runtime.race.raceId).toBe(7);
  });

  it("loads the new race when raceId changes and ignores the stale earlier response", async () => {
    const first = deferred();
    const second = deferred();
    getTeacherRaceLiveState
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(({ raceId }) => useTeacherRaceLive(raceId), {
      initialProps: { raceId: "7" },
    });

    rerender({ raceId: "8" });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      second.resolve(teacherLiveStateResponse({ raceId: 8 }));
    });
    expect(result.current.runtime.race.raceId).toBe(8);

    await act(async () => {
      first.resolve(teacherLiveStateResponse({ raceId: 7 }));
    });

    expect(getTeacherRaceLiveState).toHaveBeenNthCalledWith(1, "7");
    expect(getTeacherRaceLiveState).toHaveBeenNthCalledWith(2, "8");
    expect(result.current.runtime.race.raceId).toBe(8);
    expect(result.current.isLoading).toBe(false);
  });

  it("does not apply a response that lands after unmount", async () => {
    const pending = deferred();
    getTeacherRaceLiveState.mockReturnValueOnce(pending.promise);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { result, unmount } = renderHook(() => useTeacherRaceLive("7"));
      unmount();

      await act(async () => {
        pending.resolve(teacherLiveStateResponse());
      });

      expect(result.current.runtime).toBeNull();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
