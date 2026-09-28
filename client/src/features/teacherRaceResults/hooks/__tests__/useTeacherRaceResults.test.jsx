import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useTeacherRaceResults from "../useTeacherRaceResults";
import { getTeacherRaceResults } from "../../../../api/teacherRaceResultsApi";
import { teacherRaceResultsResponse } from "../../runtime/teacherRaceResultsTestFixtures";

vi.mock("../../../../api/teacherRaceResultsApi", () => ({
  getTeacherRaceResults: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function mountHook(raceId = "7") {
  const hook = renderHook(() => useTeacherRaceResults(raceId));
  await act(async () => {});
  return hook;
}

describe("useTeacherRaceResults", () => {
  it("starts loading, then exposes the mapped results", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    const hook = renderHook(() => useTeacherRaceResults("7"));

    expect(hook.result.current).toMatchObject({ isLoading: true, results: null, error: null });

    await act(async () => {});

    expect(getTeacherRaceResults).toHaveBeenCalledExactlyOnceWith("7");
    expect(hook.result.current).toMatchObject({ isLoading: false, error: null });
    expect(hook.result.current.results.players).toHaveLength(4);
  });

  it("normalizes the finished-only conflict", async () => {
    getTeacherRaceResults.mockRejectedValue({
      response: { status: 409, data: { error: "RACE_RESULTS_NOT_AVAILABLE", code: 3030 } },
    });
    const { result } = await mountHook();

    expect(result.current.error).toMatchObject({
      category: "CONFLICT",
      errorName: "RACE_RESULTS_NOT_AVAILABLE",
    });
    expect(result.current.results).toBeNull();
  });

  it("turns a malformed payload into a contract error", async () => {
    getTeacherRaceResults.mockResolvedValue({ status: "FINISHED" });
    const { result } = await mountHook();

    expect(result.current.error).toMatchObject({ category: "API_CONTRACT" });
    expect(result.current.results).toBeNull();
  });

  it("reloads on retry and clears the old error", async () => {
    getTeacherRaceResults
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(teacherRaceResultsResponse());
    const { result } = await mountHook();

    expect(result.current.error).toMatchObject({ category: "NETWORK" });

    await act(async () => {
      result.current.retry();
    });

    expect(getTeacherRaceResults).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.results).not.toBeNull();
  });

  it("ignores a response that arrives after unmount", async () => {
    let resolveResponse;
    getTeacherRaceResults.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    const { result, unmount } = renderHook(() => useTeacherRaceResults("7"));

    unmount();
    await act(async () => {
      resolveResponse(teacherRaceResultsResponse());
    });

    expect(result.current.results).toBeNull();
  });
});
