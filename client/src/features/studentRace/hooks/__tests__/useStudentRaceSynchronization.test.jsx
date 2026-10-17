import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useStudentRaceSynchronization from "../useStudentRaceSynchronization.js";
import { raceResponse, raceSnapshot } from "../../runtime/studentRaceTestFixtures.js";
import { requestFinishArbitration } from "../../../../api/studentRaceLiveApi.js";
import { getRaceState } from "../../../../api/racePlayerApi.js";
import { STUDENT_RACE_STATE_READ as READ } from "../../runtime/studentRaceRuntimeConstants.js";

vi.mock("../../../../api/studentRaceLiveApi.js", () => ({
  createStudentRaceEventSource: vi.fn(() => ({ close: vi.fn() })),
  requestFinishArbitration: vi.fn(),
}));
vi.mock("../../../../api/racePlayerApi.js", () => ({ getRaceState: vi.fn() }));

let silentRefresh;
beforeEach(() => { silentRefresh = vi.fn().mockResolvedValue(undefined); });

async function mount() {
  const hook = renderHook((props) => useStudentRaceSynchronization({ silentRefresh, ...props }), {
    initialProps: { raceState: raceResponse(), syncEnabled: true },
  });
  await act(async () => {});
  return hook;
}

async function signals(result, events) {
  await act(async () => {
    for (const [version, type] of events) {
      result.current.observeSignal({ version, type, occurredAtEpochMs: 10000 });
    }
  });
}

describe("student synchronization", () => {
  it("reads race state on demand, bounded by the caller's timeout, and ingests it like any other", async () => {
    const { result } = await mount();
    getRaceState.mockResolvedValueOnce(raceResponse({ eventVersion: 13, position: 300 }));

    let read;
    await act(async () => { read = await result.current.readAuthoritativeRaceState({ timeoutMs: 3000 }); });

    expect(getRaceState).toHaveBeenCalledExactlyOnceWith({ timeoutMs: 3000 });
    expect(read).toBe(READ.CURRENT);
    expect(result.current.runtimeState.player.position).toBe(300);
  });

  it("never lets an on-demand read regress fresher truth, which is still current truth", async () => {
    const { result } = await mount();
    act(() => result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 15, position: 400 })));
    getRaceState.mockResolvedValueOnce(raceResponse({ eventVersion: 14, position: 300 }));

    let read;
    await act(async () => { read = await result.current.readAuthoritativeRaceState(); });

    expect(read).toBe(READ.CURRENT);
    expect(result.current.runtimeState.player.position).toBe(400);
  });

  it("reports a valid read with the same event version as current truth", async () => {
    const { result } = await mount();
    getRaceState.mockResolvedValueOnce(raceResponse({ snapshotAtEpochMs: 10500, position: 210 }));

    let read;
    await act(async () => { read = await result.current.readAuthoritativeRaceState(); });

    expect(read).toBe(READ.CURRENT);
    expect(result.current.runtimeState.lastEventVersion).toBe(12);
  });

  it("drops an on-demand read that a resync made obsolete and says so", async () => {
    const { result } = await mount();
    let resolve;
    getRaceState.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    let pending;
    act(() => { pending = result.current.readAuthoritativeRaceState(); });
    act(() => result.current.prepareAuthoritativeResync());

    let read;
    await act(async () => { resolve(raceResponse({ eventVersion: 20, position: 900 })); read = await pending; });

    expect(read).toBe(READ.STALE);
    expect(result.current.runtimeState.player.position).toBe(200);
  });

  it("reports a broken race state as invalid instead of a silent success", async () => {
    const { result } = await mount();
    getRaceState.mockResolvedValueOnce(raceResponse({ eventVersion: 13, snapshotAtEpochMs: null }));

    let read;
    await act(async () => { read = await result.current.readAuthoritativeRaceState(); });

    expect(read).toBe(READ.INVALID);
    expect(result.current.runtimeState.lastEventVersion).toBe(12);
    expect(result.current.error.category).toBe("API_CONTRACT");
  });

  it("reports another player's race state as not this caller's truth", async () => {
    const { result } = await mount();
    const otherPlayer = { ...raceResponse().player, racePlayerId: 2, displayName: "Other" };
    getRaceState.mockResolvedValueOnce(raceResponse({ eventVersion: 3 }, { player: otherPlayer }));

    let read;
    await act(async () => { read = await result.current.readAuthoritativeRaceState(); });

    expect(read).toBe(READ.STALE);
    expect(result.current.runtimeState.player.racePlayerId).toBe(2);
  });

  it("rejects a failed on-demand read so the caller can offer a manual sync", async () => {
    const { result } = await mount();
    getRaceState.mockRejectedValueOnce(new Error("offline"));

    await act(async () => {
      await expect(result.current.readAuthoritativeRaceState()).rejects.toThrow("offline");
    });
  });

  it("preserves an in-flight proof across the normal PLAYING to FINISHED transition", async () => {
    const { result, rerender } = await mount();
    let resolve;
    requestFinishArbitration.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    let pending;
    act(() => { pending = result.current.requestFinishArbitration(); });
    act(() => result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 15,
      playerFinished: true, playerStatus: "FINISHED", position: 1000, movementUnitsPerSecond: 0 })));
    rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
    const finishOrder = { eventVersion: 14, decidedAtEpochMs: 11000, confirmedThroughEpochMs: 10000,
      confirmedFinishers: [{ racePlayerId: 1, finishedAtEpochMs: 9999, rank: 1 }] };
    await act(async () => {
      resolve({ raceId: 7, snapshot: raceSnapshot({ eventVersion: 14 }), finishOrder });
      await pending;
    });
    expect(result.current.finishOrder).toEqual(finishOrder);
    expect(result.current.runtimeState.playerFinished).toBe(true);
    expect(result.current.runtimeState.lastEventVersion).toBe(15);
  });

  it("allows a fresh passive request after an offline pause without waiting for the obsolete flight", async () => {
    const { result, rerender } = await mount();
    act(() => result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 13,
      playerFinished: true, playerStatus: "FINISHED", position: 1000, movementUnitsPerSecond: 0 })));
    rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
    await act(async () => {});
    let resolve;
    requestFinishArbitration.mockClear();
    requestFinishArbitration.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    let pending;
    act(() => { pending = result.current.requestFinishArbitration(); });
    expect(requestFinishArbitration).toHaveBeenCalledTimes(1);
    rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: false });
    rerender({ raceState: null, syncEnabled: false, finishSyncEnabled: true });
    requestFinishArbitration.mockResolvedValueOnce({ raceId: 7,
      snapshot: raceSnapshot({ eventVersion: 14, playerFinished: true, playerStatus: "FINISHED", position: 1000 }),
      finishOrder: { eventVersion: 14, decidedAtEpochMs: 11000, confirmedThroughEpochMs: 10000,
        confirmedFinishers: [{ racePlayerId: 1, finishedAtEpochMs: 9999, rank: 1 }] } });
    await act(async () => { await result.current.requestFinishArbitration(); });
    await act(async () => { resolve({ invalid: true }); await pending; });
    expect(result.current.error).toBeNull();
    expect(result.current.finishOrder.confirmedFinishers[0].racePlayerId).toBe(1);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(2);
    expect(silentRefresh).not.toHaveBeenCalled();
  });
  it("merges a proof even when its snapshot is older and keeps arbitration single-flight", async () => {
    const { result } = await mount();
    let resolve;
    requestFinishArbitration.mockReturnValue(new Promise((done) => { resolve = done; }));
    let first;
    act(() => {
      first = result.current.requestFinishArbitration();
      expect(result.current.requestFinishArbitration()).toBe(first);
      result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 15, position: 400 }));
    });
    const finishOrder = { decidedAtEpochMs: 10000, eventVersion: 14, confirmedThroughEpochMs: 9000,
      confirmedFinishers: [{ racePlayerId: 2, finishedAtEpochMs: 8000, rank: 1 }] };
    await act(async () => {
      resolve({ raceId: 7, snapshot: raceSnapshot({ eventVersion: 14, position: 300 }), finishOrder });
      await first;
    });
    expect(result.current.runtimeState.player.position).toBe(400);
    expect(result.current.finishOrder).toEqual(finishOrder);
  });

  it("ignores arbitration completing after recovery invalidates its generation", async () => {
    const { result } = await mount();
    let resolve;
    requestFinishArbitration.mockReturnValue(new Promise((done) => { resolve = done; }));
    let pending;
    act(() => {
      pending = result.current.requestFinishArbitration();
      result.current.prepareAuthoritativeResync();
    });
    await act(async () => {
      resolve({ invalid: true });
      await pending;
    });
    expect(result.current.finishOrder).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("observes regular progress without producing a GET feedback loop", async () => {
    const { result } = await mount();
    await signals(result, [[13, "PLAYER_PROGRESS_UPDATED"], [14, "PLAYER_PROGRESS_UPDATED"]]);
    expect(silentRefresh).not.toHaveBeenCalled();
    expect(result.current.runtimeState.lastEventVersion).toBe(12);
  });

  it.each(["QUESTION_ANSWERED", "PLAYER_FINISHED", "RACE_FINISHED"])("refreshes once for %s", async (type) => {
    const { result } = await mount();
    await signals(result, [[13, type]]);
    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst and ignores duplicates and older versions", async () => {
    const { result } = await mount();
    await signals(result, [[13, "QUESTION_ANSWERED"], [14, "PLAYER_FINISHED"], [15, "RACE_FINISHED"]]);
    await signals(result, [[15, "RACE_FINISHED"], [13, "QUESTION_ANSWERED"]]);
    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("requests recovery for a version gap without a hot retry loop", async () => {
    const { result } = await mount();
    await signals(result, [[16, "PLAYER_PROGRESS_UPDATED"]]);
    await act(async () => {});
    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the completing answer covers a pending signal", async () => {
    const { result } = await mount();
    let token;
    act(() => { token = result.current.beginAuthoritativeMutation(); });
    await signals(result, [[13, "QUESTION_ANSWERED"]]);
    expect(silentRefresh).not.toHaveBeenCalled();
    await act(async () => {
      result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 13 }), token);
      result.current.endAuthoritativeMutation(token);
    });
    expect(silentRefresh).not.toHaveBeenCalled();
  });

  it("waits for both mutations then refreshes an uncovered version once", async () => {
    const { result } = await mount();
    let first;
    let second;
    act(() => {
      first = result.current.beginAuthoritativeMutation();
      second = result.current.beginAuthoritativeMutation();
    });
    await signals(result, [[14, "QUESTION_ANSWERED"]]);
    await act(async () => {
      result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 13 }), first);
      result.current.endAuthoritativeMutation(first);
    });
    expect(silentRefresh).not.toHaveBeenCalled();
    await act(async () => result.current.endAuthoritativeMutation(second));
    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("rejects old-generation completions and old tokens cannot end a new mutation", async () => {
    const { result, rerender } = await mount();
    let old;
    act(() => { old = result.current.beginAuthoritativeMutation(); });
    rerender({ raceState: raceResponse(), syncEnabled: false });
    rerender({ raceState: raceResponse(), syncEnabled: true });
    let current;
    act(() => { current = result.current.beginAuthoritativeMutation(); });
    await signals(result, [[13, "QUESTION_ANSWERED"]]);
    await act(async () => {
      expect(result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 100 }), old)).toBe(false);
      result.current.endAuthoritativeMutation(old);
    });
    expect(silentRefresh).not.toHaveBeenCalled();
    expect(result.current.runtimeState.lastEventVersion).toBe(12);
    await act(async () => result.current.endAuthoritativeMutation(current));
    expect(silentRefresh).toHaveBeenCalledTimes(1);
  });

  it("keeps newer mutation truth when stale race-state arrives and preserves state on errors", async () => {
    const { result, rerender } = await mount();
    act(() => result.current.applyAuthoritativeSnapshot(raceSnapshot({ eventVersion: 15, position: 400 })));
    rerender({ raceState: raceResponse(), syncEnabled: true, requestError: new Error("offline") });
    expect(result.current.runtimeState.player.position).toBe(400);
    rerender({ raceState: raceResponse({ eventVersion: "bad" }), syncEnabled: true });
    expect(result.current.runtimeState.player.position).toBe(400);
    await act(async () => {});
    expect(result.current.error.category).toBe("API_CONTRACT");
  });
});
