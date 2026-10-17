import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chooseChallenge } from "../../../../api/racePlayerApi";
import {
  STUDENT_RACE_CHALLENGE_PHASE as PHASE,
  STUDENT_RACE_STATE_READ as READ,
} from "../../runtime/studentRaceRuntimeConstants";
import {
  CHOICE_OPTIONS,
  LOST_RESPONSE,
  NOW,
  SESSION_LOST,
  choosing,
  confirmed,
  deferred,
  renderChallenge,
  turboRun,
} from "./challengeHookTestKit";

vi.mock("../../../../api/racePlayerApi", () => ({ chooseChallenge: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStudentRaceChallenge", () => {
  it("exposes the offer only while the server says the player is choosing", () => {
    const { result, rerenderWith } = renderChallenge();

    expect(result.current.offer.offerId).toBe(17);
    expect(result.current.openChoices).toEqual(["TURBO_TRIAL", "SAFE_RUN"]);

    rerenderWith({ ...choosing(), mode: "NORMAL" });

    expect(result.current.offer).toBeNull();
    expect(result.current.openChoices).toEqual([]);
  });

  it("sends exactly one request for a synchronous double tap on two cards", async () => {
    const pending = deferred();
    chooseChallenge.mockReturnValue(pending.promise);
    const { result } = renderChallenge();

    act(() => {
      result.current.choose("TURBO_TRIAL");
      result.current.choose("SAFE_RUN");
    });

    expect(chooseChallenge).toHaveBeenCalledExactlyOnceWith({ offerId: 17, choice: "TURBO_TRIAL" }, CHOICE_OPTIONS);
    expect(result.current.phase).toBe(PHASE.SUBMITTING);
    expect(result.current.selectedChoice).toBe("TURBO_TRIAL");
    expect(result.current.openChoices).toEqual([]);
    await act(async () => { pending.resolve(confirmed()); });
  });

  it("ignores a choice the server did not offer", () => {
    const { result } = renderChallenge({ gameplay: choosing({ choices: ["SAFE_RUN"] }) });

    act(() => { result.current.choose("TURBO_TRIAL"); });

    expect(chooseChallenge).not.toHaveBeenCalled();
  });

  it("applies the confirmed snapshot with its own mutation token", async () => {
    chooseChallenge.mockResolvedValue(confirmed("SAFE_RUN"));
    const { result, sync } = renderChallenge();

    await act(async () => { await result.current.choose("SAFE_RUN"); });

    const token = sync.beginAuthoritativeMutation.mock.results[0].value;
    expect(sync.applyAuthoritativeSnapshot).toHaveBeenCalledExactlyOnceWith(confirmed("SAFE_RUN").snapshot, token);
    expect(sync.endAuthoritativeMutation).toHaveBeenCalledExactlyOnceWith(token);
    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();
    expect(result.current.phase).toBe(PHASE.IDLE);
    expect(result.current.error).toBeNull();
  });

  it("drops a response whose mutation was invalidated meanwhile", async () => {
    chooseChallenge.mockResolvedValue(confirmed());
    const { result, sync } = renderChallenge();
    sync.isMutationCurrent.mockReturnValue(false);

    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(sync.applyAuthoritativeSnapshot).not.toHaveBeenCalled();
    expect(result.current.selectedChoice).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("follows fresh race state when a lost response hid an accepted choice", async () => {
    const read = deferred();
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const { result, sync, rerenderWith } = renderChallenge();
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

    await act(async () => { result.current.choose("TURBO_TRIAL"); });

    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
    expect(chooseChallenge.mock.invocationCallOrder[0])
      .toBeLessThan(sync.readAuthoritativeRaceState.mock.invocationCallOrder[0]);
    expect(result.current.phase).toBe(PHASE.RECONCILING);
    expect(result.current.openChoices).toEqual([]);

    act(() => { result.current.choose("SAFE_RUN"); });
    expect(chooseChallenge).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerenderWith(turboRun());
      read.resolve(READ.CURRENT);
    });

    expect(result.current.offer).toBeNull();
    expect(result.current.phase).toBe(PHASE.IDLE);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it("lets only the first choice be sent again when fresh state still offers the same offer", async () => {
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const { result, sync } = renderChallenge();

    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe(PHASE.RETRY_SAME_CHOICE);
    expect(result.current.selectedChoice).toBe("TURBO_TRIAL");
    expect(result.current.openChoices).toEqual(["TURBO_TRIAL"]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);

    act(() => { result.current.choose("SAFE_RUN"); });
    expect(chooseChallenge).toHaveBeenCalledTimes(1);

    chooseChallenge.mockResolvedValueOnce(confirmed("TURBO_TRIAL"));
    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(chooseChallenge).toHaveBeenCalledTimes(2);
    expect(chooseChallenge).toHaveBeenLastCalledWith({ offerId: 17, choice: "TURBO_TRIAL" }, CHOICE_OPTIONS);
    expect(result.current.phase).toBe(PHASE.IDLE);
  });

  it("offers a manual sync when the checking read fails and checks again only on request", async () => {
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE);
    const { result, sync } = renderChallenge();
    sync.readAuthoritativeRaceState.mockRejectedValueOnce(LOST_RESPONSE);

    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(result.current.phase).toBe(PHASE.SYNC_FAILED);
    expect(result.current.openChoices).toEqual([]);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);

    const read = deferred();
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);
    act(() => {
      result.current.resync();
      result.current.resync();
    });
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(2);
    expect(result.current.phase).toBe(PHASE.RECONCILING);

    await act(async () => { read.resolve(READ.CURRENT); });

    expect(result.current.phase).toBe(PHASE.RETRY_SAME_CHOICE);
    expect(result.current.openChoices).toEqual(["TURBO_TRIAL"]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it.each([
    [404, "CHALLENGE_OFFER_NOT_FOUND"],
    [409, "CHALLENGE_OFFER_EXPIRED"],
    [409, "CHALLENGE_CHOICE_CONFLICT"],
    [409, "CHALLENGE_EXECUTION_STATE_INVALID"],
  ])("locks the cards and checks fresh race state once after %s %s, without a second request",
    async (status, errorName) => {
      const read = deferred();
      chooseChallenge.mockRejectedValueOnce({ response: { status, data: { error: errorName } } });
      const { result, sync } = renderChallenge();
      sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

      await act(async () => { result.current.choose("TURBO_TRIAL"); });

      expect(result.current.error.errorName).toBe(errorName);
      expect(result.current.phase).toBe(PHASE.RECONCILING);
      act(() => {
        result.current.choose("TURBO_TRIAL");
        result.current.choose("SAFE_RUN");
      });
      await act(async () => { read.resolve(READ.CURRENT); });

      expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
      expect(chooseChallenge).toHaveBeenCalledTimes(1);
    });


  it("leaves a lost session to the session gate without guessing through a read", async () => {
    chooseChallenge.mockRejectedValueOnce(SESSION_LOST);
    const { result, sync } = renderChallenge();

    await act(async () => { await result.current.choose("TURBO_TRIAL"); });

    expect(result.current.error.category).toBe("RACE_PLAYER_SESSION");
    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();
  });

  it("checks the server deadline at tap time even when the timer has not fired yet", async () => {
    const { result, sync } = renderChallenge({ gameplay: choosing({ expiresAtEpochMs: NOW + 1000 }) });
    vi.setSystemTime(NOW + 1000);

    await act(async () => {
      result.current.choose("TURBO_TRIAL");
      result.current.choose("TURBO_TRIAL");
    });

    expect(chooseChallenge).not.toHaveBeenCalled();
    expect(result.current.isExpired).toBe(true);
    expect(result.current.openChoices).toEqual([]);
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
  });

  it("locks the cards and reads fresh race truth once when the server deadline passes", async () => {
    const { result, sync } = renderChallenge({ gameplay: choosing({ serverClockOffsetMs: 2000 }) });

    act(() => { vi.advanceTimersByTime(9999); });
    expect(result.current.isExpired).toBe(false);

    await act(async () => { vi.advanceTimersByTime(1); });
    expect(result.current.isExpired).toBe(true);
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);

    act(() => { result.current.choose("TURBO_TRIAL"); });
    await act(async () => { vi.advanceTimersByTime(20000); });
    expect(chooseChallenge).not.toHaveBeenCalled();
    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
  });

  it("keeps a pending choice alive when its deadline passes and applies the late confirmation", async () => {
    const pending = deferred();
    chooseChallenge.mockReturnValue(pending.promise);
    const { result, sync } = renderChallenge({ gameplay: choosing({ expiresAtEpochMs: NOW + 1000 }) });

    act(() => { result.current.choose("TURBO_TRIAL"); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.phase).toBe(PHASE.SUBMITTING);

    await act(async () => { pending.resolve(confirmed()); });

    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();
    expect(sync.applyAuthoritativeSnapshot).toHaveBeenCalledTimes(1);
  });

  it("syncs on request while the offer is unreadable and ignores repeated taps", async () => {
    const read = deferred();
    const { result, sync } = renderChallenge({ gameplay: { ...choosing(), challenge: null } });
    sync.readAuthoritativeRaceState.mockReturnValueOnce(read.promise);

    expect(result.current.offer).toBeNull();

    act(() => {
      result.current.resync();
      result.current.resync();
    });

    expect(sync.readAuthoritativeRaceState).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe(PHASE.RECONCILING);

    await act(async () => { read.resolve(READ.CURRENT); });

    expect(result.current.phase).toBe(PHASE.IDLE);
  });

  it("arms no deadline and accepts no choice or sync while gameplay is not active", () => {
    const { result, sync } = renderChallenge({ enabled: false });

    act(() => {
      result.current.choose("TURBO_TRIAL");
      result.current.resync();
    });
    act(() => { vi.advanceTimersByTime(30000); });

    expect(chooseChallenge).not.toHaveBeenCalled();
    expect(sync.readAuthoritativeRaceState).not.toHaveBeenCalled();
    expect(result.current.openChoices).toEqual([]);
  });

  it("clears its deadline timer on unmount", () => {
    const { unmount } = renderChallenge();

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
