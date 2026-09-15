import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import useTeacherRaceEventStream from "../useTeacherRaceEventStream";
import { createTeacherRaceEventSource } from "../../../../api/teacherRaceLiveApi";
import { teacherLiveEvent } from "../../runtime/teacherRaceLiveTestFixtures";
import { ERROR_CATEGORIES } from "../../../../errors/errorCategories";

vi.mock("../../../../api/teacherRaceLiveApi", () => ({
  createTeacherRaceEventSource: vi.fn(() => ({ readyState: 0, close: vi.fn() })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it("opens the teacher stream after the given version and forwards mapped envelopes", () => {
  const onEvent = vi.fn();
  const onError = vi.fn();
  const { rerender } = renderHook(
    (props) => useTeacherRaceEventStream({ enabled: true, generation: 0, onEvent, onError, ...props }),
    { initialProps: { raceId: "7", afterVersion: 12 } },
  );
  const source = createTeacherRaceEventSource.mock.results[0].value;
  expect(createTeacherRaceEventSource).toHaveBeenCalledExactlyOnceWith("7", 12);

  act(() => source.onmessage({ data: JSON.stringify(teacherLiveEvent()) }));
  expect(onEvent).toHaveBeenCalledTimes(1);
  expect(onEvent.mock.calls[0][0]).toMatchObject({ raceId: 7, version: 13, type: "PLAYER_PROGRESS_UPDATED" });

  rerender({ raceId: "7", afterVersion: 13 });
  expect(createTeacherRaceEventSource).toHaveBeenCalledTimes(1);

  act(() => source.onmessage({ data: "{not json" }));
  act(() => source.onmessage({ data: JSON.stringify(teacherLiveEvent({ version: 0 })) }));
  expect(onError).toHaveBeenCalledTimes(2);
  expect(onError.mock.calls[0][0].error.category).toBe(ERROR_CATEGORIES.UNKNOWN);
  expect(onError.mock.calls[1][0].error.category).toBe(ERROR_CATEGORIES.API_CONTRACT);
  expect(source.close).not.toHaveBeenCalled();
});
