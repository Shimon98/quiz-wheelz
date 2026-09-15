import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useTeacherRaceLive from "../useTeacherRaceLive";
import {
  createTeacherRaceEventSource,
  getTeacherRaceLiveState,
} from "../../../../api/teacherRaceLiveApi";
import {
  teacherLiveEvent,
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../runtime/teacherRaceLiveTestFixtures";
import { TEACHER_CONNECTION_STATES } from "../../runtime/teacherRaceLiveConstants";
import { TEACHER_RACE_LIVE_CONFIG } from "../../config/teacherRaceLiveConfig";
import { EVENT_SOURCE_READY_STATES } from "../../../../shared/live/useEventSourceStream";

vi.mock("../../../../api/teacherRaceLiveApi", () => ({
  getTeacherRaceLiveState: vi.fn(),
  createTeacherRaceEventSource: vi.fn(),
}));

const GRACE_MS = TEACHER_RACE_LIVE_CONFIG.recovery.nativeReconnectGraceMs;
let sources;

function source(index = sources.length - 1) {
  return sources[index];
}

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function send(target, overrides) {
  act(() => target.onmessage({ data: JSON.stringify(teacherLiveEvent(overrides)) }));
}

function fail(target, readyState) {
  target.readyState = readyState;
  act(() => target.onerror());
}

function open(target) {
  target.readyState = EVENT_SOURCE_READY_STATES.OPEN;
  act(() => target.onopen());
}

function serverFailure(status) {
  return { response: { status, data: { error: "INTERNAL_ERROR", code: 1 } } };
}

async function mountLive(response = teacherLiveStateResponse()) {
  getTeacherRaceLiveState.mockResolvedValueOnce(response);
  const hook = renderHook(({ raceId }) => useTeacherRaceLive(raceId), { initialProps: { raceId: "7" } });
  await flush();
  return hook;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
  sources = [];
  createTeacherRaceEventSource.mockImplementation(() => {
    const created = { readyState: EVENT_SOURCE_READY_STATES.CONNECTING, close: vi.fn() };
    sources.push(created);
    return created;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("useTeacherRaceLive live synchronization", () => {
  it("opens one stream after the loaded version, goes LIVE on open and applies contiguous events without reopening", async () => {
    const { result } = await mountLive();

    expect(createTeacherRaceEventSource).toHaveBeenCalledExactlyOnceWith("7", 12);
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.CONNECTING);

    open(source());
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.LIVE);

    send(source(), { version: 13 });
    send(source(), { version: 14, type: "QUESTION_ANSWERED", payload: { racePlayerId: 91, questionId: 3, correct: true } });
    send(source(), { version: 14 });

    expect(result.current.runtime.eventVersion).toBe(14);
    expect(result.current.runtime.players[0].position).toBe(140);
    expect(result.current.recentEvents.map((item) => item.kind)).toEqual(["CORRECT_ANSWER"]);
    expect(createTeacherRaceEventSource).toHaveBeenCalledTimes(1);
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(1);
  });

  it("opens no stream for a race that is already finished and reports ENDED", async () => {
    const { result } = await mountLive(teacherLiveStateResponse({ status: "FINISHED" }));

    expect(createTeacherRaceEventSource).not.toHaveBeenCalled();
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.ENDED);
  });

  it("lets the browser reconnect natively and returns to LIVE without a recovery GET", async () => {
    const { result } = await mountLive();
    open(source());

    fail(source(), EVENT_SOURCE_READY_STATES.CONNECTING);
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.RECOVERING);
    expect(source().close).not.toHaveBeenCalled();
    expect(createTeacherRaceEventSource).toHaveBeenCalledTimes(1);

    await flush(GRACE_MS / 2);
    open(source());
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.LIVE);

    await flush(GRACE_MS);
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(1);
    expect(createTeacherRaceEventSource).toHaveBeenCalledTimes(1);
  });

  it("recovers through an authoritative GET when native reconnect exceeds the grace period", async () => {
    const { result } = await mountLive();
    open(source());
    fail(source(), EVENT_SOURCE_READY_STATES.CONNECTING);

    getTeacherRaceLiveState.mockResolvedValueOnce(teacherLiveStateResponse({ eventVersion: 40 }));
    await flush(GRACE_MS);

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(source(0).close).toHaveBeenCalledTimes(1);
    expect(createTeacherRaceEventSource).toHaveBeenLastCalledWith("7", 40);
    expect(result.current.runtime.eventVersion).toBe(40);

    open(source());
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.LIVE);
  });

  it.each([
    ["a version gap", { version: 20 }],
    ["an event from another race", { raceId: 8 }],
    ["a malformed known payload", { payload: { players: null } }],
  ])("keeps the last runtime visible and recovers from %s", async (_label, overrides) => {
    const { result } = await mountLive();
    open(source());
    const before = result.current.runtime;

    getTeacherRaceLiveState.mockResolvedValueOnce(teacherLiveStateResponse({ eventVersion: 25 }));
    send(source(), overrides);

    expect(result.current.runtime).toBe(before);
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.RECOVERING);
    await flush();

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(result.current.runtime.eventVersion).toBe(25);
    expect(createTeacherRaceEventSource).toHaveBeenLastCalledWith("7", 25);
  });

  it("recovers from malformed stream data and from a closed source", async () => {
    const { result } = await mountLive();
    open(source());

    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse({ eventVersion: 30 }));
    act(() => source().onmessage({ data: "{not json" }));
    await flush();
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(result.current.runtime.eventVersion).toBe(30);

    fail(source(), EVENT_SOURCE_READY_STATES.CLOSED);
    await flush();
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(3);
    expect(sources).toHaveLength(3);
  });

  it("retries a transient recovery failure with backoff while keeping the last runtime", async () => {
    const { result } = await mountLive();
    open(source());

    getTeacherRaceLiveState
      .mockRejectedValueOnce(serverFailure(503))
      .mockResolvedValueOnce(teacherLiveStateResponse({ eventVersion: 22 }));
    send(source(), { version: 20 });
    await flush();

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(result.current.runtime.eventVersion).toBe(12);
    expect(result.current.error).toBeNull();
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.RECOVERING);

    await flush(TEACHER_RACE_LIVE_CONFIG.recovery.initialDelayMs);

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(3);
    expect(result.current.runtime.eventVersion).toBe(22);
  });

  it("surfaces a terminal recovery failure as an error and recovers again on manual retry", async () => {
    const { result } = await mountLive();
    open(source());

    getTeacherRaceLiveState.mockRejectedValueOnce(serverFailure(404));
    send(source(), { version: 20 });
    await flush();

    expect(result.current.error.status).toBe(404);
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.ERROR);
    expect(source(0).close).toHaveBeenCalledTimes(1);

    getTeacherRaceLiveState.mockResolvedValueOnce(teacherLiveStateResponse({ eventVersion: 21 }));
    act(() => result.current.retry());
    await flush();

    expect(result.current.error).toBeNull();
    expect(result.current.runtime.eventVersion).toBe(21);
    expect(createTeacherRaceEventSource).toHaveBeenLastCalledWith("7", 21);
  });

  it("closes the stream while offline and reloads fresh truth when the browser is back online", async () => {
    const { result } = await mountLive();
    open(source());

    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.OFFLINE);
    expect(source(0).close).toHaveBeenCalledTimes(1);

    await flush(GRACE_MS * 2);
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(1);

    getTeacherRaceLiveState.mockResolvedValueOnce(teacherLiveStateResponse({ eventVersion: 33 }));
    act(() => window.dispatchEvent(new Event("online")));
    await flush();

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(createTeacherRaceEventSource).toHaveBeenLastCalledWith("7", 33);
    open(source());
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.LIVE);
  });

  it("closes the stream and ends the connection when the race finishes", async () => {
    const { result } = await mountLive();
    open(source());
    const finisher = teacherLivePlayer({ status: "FINISHED", position: 1000 });

    send(source(), {
      version: 13,
      type: "RACE_FINISHED",
      payload: { raceStatus: "FINISHED", finishedAtEpochMs: 1_755_600_090_000, players: [finisher] },
    });

    expect(result.current.runtime.race.status).toBe("FINISHED");
    expect(result.current.connectionState).toBe(TEACHER_CONNECTION_STATES.ENDED);
    expect(source(0).close).toHaveBeenCalledTimes(1);
    expect(result.current.recentEvents.map((item) => item.kind)).toEqual(["RACE_FINISHED"]);

    await flush(GRACE_MS * 2);
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(1);
    expect(createTeacherRaceEventSource).toHaveBeenCalledTimes(1);
  });

  it("drops the old stream and stale recovery when the race changes", async () => {
    const { result, rerender } = await mountLive();
    open(source());

    getTeacherRaceLiveState.mockResolvedValueOnce(teacherLiveStateResponse({ raceId: 8, eventVersion: 3 }));
    rerender({ raceId: "8" });
    expect(source(0).close).toHaveBeenCalledTimes(1);
    expect(result.current.runtime).toBeNull();

    await flush();
    expect(result.current.runtime.race.raceId).toBe(8);
    expect(createTeacherRaceEventSource).toHaveBeenLastCalledWith("8", 3);
    expect(result.current.recentEvents).toEqual([]);
  });

  it("closes the stream on unmount and ignores late timers", async () => {
    const { unmount } = await mountLive();
    open(source());
    fail(source(), EVENT_SOURCE_READY_STATES.CONNECTING);

    unmount();
    expect(source(0).close).toHaveBeenCalledTimes(1);

    await flush(GRACE_MS * 2);
    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(1);
  });
});
