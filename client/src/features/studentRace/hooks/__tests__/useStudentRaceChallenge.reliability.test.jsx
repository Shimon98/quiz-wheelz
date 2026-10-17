import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chooseChallenge } from "../../../../api/racePlayerApi";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import {
  STUDENT_RACE_CHALLENGE_PHASE as PHASE,
  STUDENT_RACE_STATE_READ as READ,
} from "../../runtime/studentRaceRuntimeConstants";
import {
  CHECK_OPTIONS,
  CHOICE_OPTIONS,
  LOST_RESPONSE,
  NOW,
  choosing,
  deferred,
  renderChallenge,
  turboRun,
} from "./challengeHookTestKit";
import { axiosTimeoutAfter } from "../../../../test/axiosTimeout";

vi.mock("../../../../api/racePlayerApi", () => ({ chooseChallenge: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStudentRaceChallenge reliability", () => {
  it("bounds a silent choice request and checks it once, without a second request", async () => {
    chooseChallenge.mockImplementation((_request, { timeoutMs }) => axiosTimeoutAfter(timeoutMs));
    const read = deferred();
    const { result, sync } = renderChallenge();
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

    act(() => { result.current.choose("TURBO_TRIAL"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs - 1); });

    expect(result.current.phase).toBe(PHASE.SUBMITTING);
    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();

    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(result.current.phase).toBe(PHASE.RECONCILING);
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledExactlyOnceWith(CHECK_OPTIONS);
    await act(async () => { read.resolve(READ.CURRENT); });
    expect(chooseChallenge).toHaveBeenCalledExactlyOnceWith({ offerId: 17, choice: "TURBO_TRIAL" }, CHOICE_OPTIONS);
  });

  it("bounds a silent check read and offers a manual sync instead of an endless wait", async () => {
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const { result, sync } = renderChallenge();
    sync.readAuthoritativeRaceState.mockImplementationOnce(({ timeoutMs }) => axiosTimeoutAfter(timeoutMs));

    await act(async () => { result.current.choose("TURBO_TRIAL"); });
    expect(result.current.phase).toBe(PHASE.RECONCILING);

    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.challengeCheckTimeoutMs); });

    expect(result.current.phase).toBe(PHASE.SYNC_FAILED);
    expect(result.current.error.category).toBe("NETWORK");

    await act(async () => { await result.current.resync(); });

    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(2);
    expect(result.current.phase).toBe(PHASE.RETRY_SAME_CHOICE);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it.each([READ.STALE, READ.INVALID])("never treats a %s check read as proof and asks for a manual check", async (read) => {
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const { result, sync } = renderChallenge();
    sync.readAuthoritativeRaceState.mockResolvedValueOnce(read);

    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(result.current.phase).toBe(PHASE.SYNC_FAILED);
    expect(result.current.openChoices).toEqual([]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it("never reopens a card the deadline closed while the check ran", async () => {
    chooseChallenge.mockImplementation((_request, { timeoutMs }) => axiosTimeoutAfter(timeoutMs));
    const read = deferred();
    const { result, sync } = renderChallenge({ gameplay: choosing({ expiresAtEpochMs: NOW + 5000 }) });
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

    act(() => { result.current.choose("TURBO_TRIAL"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(result.current.isExpired).toBe(true);

    await act(async () => { read.resolve(READ.CURRENT); });
    act(() => { result.current.choose("TURBO_TRIAL"); });

    expect(result.current.openChoices).toEqual([]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the page is left", (hook) => hook.unmount()],
    ["the race stops being playable", (hook) => hook.rerender({ gameplay: choosing(), enabled: false, ...hook.sync })],
    ["the server already moved on to the run", (hook) => hook.rerenderWith(turboRun())],
  ])("starts no late check when %s while the choice is in flight", async (_, moveOn) => {
    const pending = deferred();
    chooseChallenge.mockReturnValueOnce(pending.promise);
    const hook = renderChallenge();

    act(() => { hook.result.current.choose("TURBO_TRIAL"); });
    act(() => { moveOn(hook); });
    await act(async () => { pending.reject(LOST_RESPONSE); });

    expect(hook.sync.readAuthoritativeRaceState).not.toHaveBeenCalled();
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it("keeps a manual check for the same offer after a reconnect instead of a frozen card", async () => {
    const pending = deferred();
    chooseChallenge.mockReturnValueOnce(pending.promise);
    const { result, rerender, sync } = renderChallenge();

    act(() => { result.current.choose("TURBO_TRIAL"); });
    rerender({ gameplay: choosing(), enabled: false, ...sync });
    await act(async () => { pending.reject(LOST_RESPONSE); });
    rerender({ gameplay: choosing(), enabled: true, ...sync });

    expect(result.current.phase).toBe(PHASE.SYNC_FAILED);
    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();

    await act(async () => { await result.current.resync(); });

    expect(result.current.phase).toBe(PHASE.RETRY_SAME_CHOICE);
    expect(result.current.openChoices).toEqual(["TURBO_TRIAL"]);
  });

  it("never lets a late check for an old offer change the cards of a new offer", async () => {
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const read = deferred();
    const { result, sync, rerenderWith } = renderChallenge();
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

    await act(async () => { result.current.choose("TURBO_TRIAL"); });
    rerenderWith(choosing({ offerId: 18 }));
    await act(async () => { read.resolve(READ.CURRENT); });

    expect(result.current.offer.offerId).toBe(18);
    expect(result.current.phase).toBe(PHASE.IDLE);
    expect(result.current.openChoices).toEqual(["TURBO_TRIAL", "SAFE_RUN"]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });
});
