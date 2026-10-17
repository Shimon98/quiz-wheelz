import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { STUDENT_RACE_STATE_READ as READ } from "../../runtime/studentRaceRuntimeConstants";
import useStudentRaceChallenge from "../useStudentRaceChallenge";

export const NOW = 1_800_000_000_000;
export const LOST_RESPONSE = { code: "ERR_NETWORK", message: "Network Error" };
export const SESSION_LOST = { response: { status: 401, data: { error: "INVALID_RACE_PLAYER_TOKEN" } } };
export const CHOICE_OPTIONS = { timeoutMs: STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs };
export const CHECK_OPTIONS = { timeoutMs: STUDENT_RACE_CONFIG.challengeCheckTimeoutMs };

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

export function choosing(offerOverrides = {}) {
  return {
    mode: "CHALLENGE_CHOICE",
    effectiveSpeed: 1,
    activeEffects: [],
    challenge: {
      energy: 0,
      threshold: 100,
      offer: {
        offerId: 17,
        expiresAtEpochMs: NOW + 12000,
        serverClockOffsetMs: 0,
        choices: ["TURBO_TRIAL", "SAFE_RUN"],
        ...offerOverrides,
      },
      run: null,
      lastResult: null,
    },
  };
}

export function turboRun() {
  return {
    mode: "TURBO_TRIAL",
    effectiveSpeed: 1,
    activeEffects: [],
    challenge: {
      energy: 0,
      threshold: 100,
      offer: null,
      run: { challengeId: 17, type: "TURBO_TRIAL", questionsResolved: 0, totalQuestions: 1, correctAnswers: 0 },
      lastResult: null,
    },
  };
}

export function confirmed(choice = "TURBO_TRIAL") {
  return {
    offerId: 17,
    choice,
    selectedAtEpochMs: NOW + 1000,
    snapshot: {
      totalDistance: 1000,
      score: 0,
      position: 100,
      speed: 1,
      streak: 0,
      highestStreak: 0,
      snapshotAtEpochMs: NOW + 1000,
      movementUnitsPerSecond: 4,
      eventVersion: 3,
      raceStatus: "IN_PROGRESS",
      playerStatus: "RACING",
      playerFinished: false,
      raceFinished: false,
      opponents: [],
    },
  };
}

export function renderChallenge(overrides = {}) {
  const sync = {
    readAuthoritativeRaceState: vi.fn().mockResolvedValue(READ.CURRENT),
    applyAuthoritativeSnapshot: vi.fn(() => true),
    beginAuthoritativeMutation: vi.fn(() => ({ id: Symbol("mutation") })),
    endAuthoritativeMutation: vi.fn(),
    isMutationCurrent: vi.fn(() => true),
  };
  const hook = renderHook((props) => useStudentRaceChallenge(props), {
    initialProps: { gameplay: choosing(), enabled: true, ...sync, ...overrides },
  });
  const rerenderWith = (gameplay) => hook.rerender({ gameplay, enabled: true, ...sync, ...overrides });
  return { ...hook, sync, rerenderWith };
}
