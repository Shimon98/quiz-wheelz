import { describe, expect, it } from "vitest";

import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import { deriveStudentRaceMoments } from "../deriveStudentRaceMoments";

function result(challengeId, outcome = "TURBO_SUCCESS", type = "TURBO_TRIAL") {
  return { challengeId, type, outcome, questionsResolved: 1, correctAnswers: 1, completedAtEpochMs: 10_000 + challengeId };
}

function runtime({ lastResult = null, raceId = 7, racePlayerId = 1, playerFinished = false,
  activeEffect = null, feedbackEventId = null } = {}) {
  return {
    race: { id: raceId },
    player: { racePlayerId },
    playerFinished,
    visual: { activeEffect, feedbackEventId, feedbackStreak: 0, timeUpQuestionId: null },
    gameplay: { mode: "NORMAL", challenge: { energy: 0, threshold: 100, offer: null, run: null, lastResult } },
  };
}

function run(...runtimes) {
  const fired = [];
  let previous = null;
  for (const state of runtimes) {
    const { observed, moments } = deriveStudentRaceMoments(previous, state);
    previous = observed;
    fired.push(moments.map(({ type }) => type));
  }
  return { fired, observed: previous };
}

describe("deriveStudentRaceMoments challenge results", () => {
  it("treats a result already present on the first observation as a baseline", () => {
    expect(run(runtime({ lastResult: result(5) }), runtime({ lastResult: result(5) })).fired).toEqual([[], []]);
  });

  it.each([
    ["TURBO_SUCCESS", "TURBO_TRIAL", STUDENT_RACE_MOMENT.TURBO_SUCCESS],
    ["TURBO_FAILURE", "TURBO_TRIAL", STUDENT_RACE_MOMENT.TURBO_FAILURE],
    ["SAFE_COMPLETE", "SAFE_RUN", STUDENT_RACE_MOMENT.SAFE_COMPLETE],
    ["SAFE_PERFECT", "SAFE_RUN", STUDENT_RACE_MOMENT.SAFE_PERFECT],
  ])("plays a new %s result exactly once", (outcome, type, moment) => {
    expect(run(
      runtime(),
      runtime({ lastResult: result(6, outcome, type) }),
      runtime({ lastResult: result(6, outcome, type) }),
    ).fired).toEqual([[], [moment], []]);
  });

  it("carries the challenge identity on the moment", () => {
    const { moments } = deriveStudentRaceMoments(deriveStudentRaceMoments(null, runtime()).observed,
      runtime({ lastResult: result(8) }));

    expect(moments).toEqual([{ type: STUDENT_RACE_MOMENT.TURBO_SUCCESS, id: "challenge-8", challengeId: 8 }]);
  });

  it("never replays an older result that a stale snapshot brings back", () => {
    expect(run(
      runtime({ lastResult: result(3) }),
      runtime({ lastResult: result(4, "SAFE_PERFECT", "SAFE_RUN") }),
      runtime({ lastResult: result(3) }),
      runtime({ lastResult: result(4, "SAFE_PERFECT", "SAFE_RUN") }),
    ).fired).toEqual([[], [STUDENT_RACE_MOMENT.SAFE_PERFECT], [], []]);
  });

  it("plays two different challenges once each, in order", () => {
    expect(run(
      runtime(),
      runtime({ lastResult: result(10) }),
      runtime({ lastResult: result(11, "TURBO_FAILURE") }),
    ).fired).toEqual([[], [STUDENT_RACE_MOMENT.TURBO_SUCCESS], [STUDENT_RACE_MOMENT.TURBO_FAILURE]]);
  });

  it("never leaks a result across a race or player switch", () => {
    expect(run(
      runtime({ lastResult: result(20) }),
      runtime({ raceId: 8, lastResult: result(21) }),
      runtime({ raceId: 8, racePlayerId: 2, lastResult: result(22) }),
      runtime({ raceId: 8, racePlayerId: 2, lastResult: result(23, "SAFE_COMPLETE", "SAFE_RUN") }),
    ).fired).toEqual([[], [], [], [STUDENT_RACE_MOMENT.SAFE_COMPLETE]]);
  });

  it("lets the finish outrank a result that arrives with it and never replays that result later", () => {
    expect(run(
      runtime(),
      runtime({ lastResult: result(30), playerFinished: true }),
      runtime({ lastResult: result(30), playerFinished: true }),
    ).fired).toEqual([[], [STUDENT_RACE_MOMENT.FINISH], []]);
  });

  it("plays the answer feedback and the result it caused in one batch, answer first", () => {
    expect(run(
      runtime(),
      runtime({ lastResult: result(40), activeEffect: "correct", feedbackEventId: 400 }),
    ).fired).toEqual([[], ["correct", STUDENT_RACE_MOMENT.TURBO_SUCCESS]]);
  });

  it("stays silent for an unknown outcome or a malformed result without crashing", () => {
    expect(run(
      runtime(),
      runtime({ lastResult: result(50, "FUTURE_OUTCOME") }),
      runtime({ lastResult: { challengeId: "x", outcome: "TURBO_SUCCESS" } }),
      runtime({ lastResult: result(50, "FUTURE_OUTCOME") }),
    ).fired).toEqual([[], [], [], []]);
  });

  it("keeps its memory bounded across a long race", () => {
    let previous = deriveStudentRaceMoments(null, runtime()).observed;
    for (let id = 1; id <= 500; id += 1) {
      previous = deriveStudentRaceMoments(previous,
        runtime({ activeEffect: "correct", feedbackEventId: id, lastResult: result(id) })).observed;
    }

    expect(previous.seenFeedbackEventIds.size).toBeLessThanOrEqual(64);
    expect(previous.seenChallengeResultId).toBe(500);
  });
});
