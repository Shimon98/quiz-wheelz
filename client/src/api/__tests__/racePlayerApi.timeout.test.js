import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  chooseChallenge,
  getCurrentQuestion,
  getRaceState,
  heartbeatRacePlayer,
  joinRace,
  reconnectRacePlayer,
  submitAnswer,
} from "../racePlayerApi.js";
import { requestFinishArbitration } from "../studentRaceLiveApi.js";
import { normalizeApiError } from "../../errors/normalizeApiError.js";

// A server that takes the request and never answers: only the request's own
// timeout can end the wait, like a stalled phone network.
class SilentServerXhr {
  static sent = [];

  readyState = 0;
  status = 0;
  timeout = 0;
  withCredentials = false;
  responseText = "";
  onloadend = null;
  onabort = null;
  onerror = null;
  ontimeout = null;

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader() {}

  getAllResponseHeaders() {
    return "";
  }

  abort() {}

  send(body) {
    SilentServerXhr.sent.push({ method: this.method, url: this.url, body });
    if (this.timeout > 0) setTimeout(() => this.ontimeout?.(), this.timeout);
  }
}

function track(promise) {
  const state = { settled: false, error: null };
  promise.then(
    () => { state.settled = true; },
    (error) => { state.settled = true; state.error = error; },
  );
  return state;
}

beforeEach(() => {
  vi.useFakeTimers();
  SilentServerXhr.sent = [];
  vi.stubGlobal("XMLHttpRequest", SilentServerXhr);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("race player requests against a silent server", () => {
  it("ends a challenge choice at its own timeout as an unknown network outcome, sent once", async () => {
    const request = track(chooseChallenge({ offerId: 17, choice: "TURBO_TRIAL" }, { timeoutMs: 4000 }));

    await vi.advanceTimersByTimeAsync(3999);
    expect(request.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(request.error.code).toBe("ECONNABORTED");
    expect(normalizeApiError(request.error).category).toBe("NETWORK");
    expect(SilentServerXhr.sent).toHaveLength(1);
    expect(JSON.parse(SilentServerXhr.sent[0].body)).toEqual({ offerId: 17, choice: "TURBO_TRIAL" });
  });

  it("ends a bounded race-state read at its own timeout", async () => {
    const read = track(getRaceState({ timeoutMs: 3000 }));

    await vi.advanceTimersByTimeAsync(2999);
    expect(read.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(normalizeApiError(read.error).category).toBe("NETWORK");
  });

  it.each([
    ["race-state", () => getRaceState(), 5000],
    ["current question", () => getCurrentQuestion(), 5000],
    ["answer", () => submitAnswer({ questionId: 3, choiceId: 9 }), 5000],
    ["finish arbitration", () => requestFinishArbitration(), 5000],
    ["heartbeat", () => heartbeatRacePlayer(), 8000],
    ["reconnect", () => reconnectRacePlayer(), 8000],
  ])("bounds the %s call so a stalled network cannot pin its hook forever, sent once", async (_, call, limitMs) => {
    const request = track(call());

    await vi.advanceTimersByTimeAsync(limitMs - 1);
    expect(request.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(normalizeApiError(request.error).category).toBe("NETWORK");
    expect(SilentServerXhr.sent).toHaveLength(1);
  });

  it("leaves the join unbounded: a lost join response must not invite a retry that hits 'name taken'", async () => {
    const join = track(joinRace({ roomCode: "ABC123", displayName: "Kid" }));

    await vi.advanceTimersByTimeAsync(60_000);

    expect(join.settled).toBe(false);
    expect(SilentServerXhr.sent).toHaveLength(1);
  });
});
