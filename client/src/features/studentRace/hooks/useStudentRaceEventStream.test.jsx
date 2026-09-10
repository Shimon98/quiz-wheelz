import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import useStudentRaceEventStream from "./useStudentRaceEventStream.js";
import { createStudentRaceEventSource } from "../../../api/studentRaceLiveApi.js";

vi.mock("../../../api/studentRaceLiveApi.js", () => ({ createStudentRaceEventSource: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  createStudentRaceEventSource.mockImplementation(() => ({ close: vi.fn() }));
});

it("keeps one source as snapshots advance and reopens at the latest cursor after recovery", () => {
  const onSignal = vi.fn();
  const { rerender, unmount } = renderHook((props) => useStudentRaceEventStream({ onSignal, ...props }), {
    initialProps: { enabled: true, afterVersion: 12 },
  });
  const first = createStudentRaceEventSource.mock.results[0].value;
  rerender({ enabled: true, afterVersion: 15 });
  expect(createStudentRaceEventSource).toHaveBeenCalledTimes(1);
  const lateCallback = first.onmessage;
  rerender({ enabled: false, afterVersion: 15 });
  expect(first.close).toHaveBeenCalledTimes(1);
  act(() => lateCallback({ data: '{"version":16,"type":"PLAYER_FINISHED","occurredAtEpochMs":1000}' }));
  expect(onSignal).not.toHaveBeenCalled();
  rerender({ enabled: true, afterVersion: 18 });
  expect(createStudentRaceEventSource).toHaveBeenLastCalledWith(18);
  const second = createStudentRaceEventSource.mock.results[1].value;
  unmount();
  expect(first.close).toHaveBeenCalledTimes(1);
  expect(second.close).toHaveBeenCalledTimes(1);
});

it("maps safe signals and leaves native reconnect to EventSource", () => {
  const onSignal = vi.fn();
  const onError = vi.fn();
  renderHook(() => useStudentRaceEventStream({ enabled: true, afterVersion: 0, onSignal, onError }));
  const source = createStudentRaceEventSource.mock.results[0].value;
  act(() => source.onmessage({ data: '{"version":1,"type":"QUESTION_ANSWERED","occurredAtEpochMs":1000,"payload":"ignored"}' }));
  expect(onSignal).toHaveBeenCalledWith({ version: 1, type: "QUESTION_ANSWERED", occurredAtEpochMs: 1000 });
  act(() => source.onmessage({ data: '{"version":-1}' }));
  expect(onError).toHaveBeenCalled();
  act(() => source.onerror());
  expect(source.close).not.toHaveBeenCalled();
  expect(createStudentRaceEventSource).toHaveBeenCalledTimes(1);
});
