import { describe, expect, it } from "vitest";

import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import { deriveStudentRaceMoments } from "../deriveStudentRaceMoments";

const offer = (offerId) => ({ offerId, expiresAtEpochMs: 50_000, serverClockOffsetMs: 0, choices: ["TURBO_TRIAL", "SAFE_RUN"] });
const run = (challengeId, type = "TURBO_TRIAL") => ({
  challengeId, type, questionsResolved: 0, totalQuestions: type === "TURBO_TRIAL" ? 1 : 3, correctAnswers: 0,
});

function runtime({ offer: currentOffer = null, run: currentRun = null, raceId = 7, racePlayerId = 1, playerFinished = false,
  activeEffect = null, feedbackEventId = null } = {}) {
  return {
    race: { id: raceId },
    player: { racePlayerId },
    playerFinished,
    visual: { activeEffect, feedbackEventId, feedbackStreak: 0, timeUpQuestionId: null },
    gameplay: {
      mode: currentOffer ? "CHALLENGE_CHOICE" : currentRun?.type ?? "NORMAL",
      challenge: { energy: 0, threshold: 100, offer: currentOffer, run: currentRun, lastResult: null },
    },
  };
}

function fired(...runtimes) {
  const out = [];
  let previous = null;
  for (const state of runtimes) {
    const { observed, moments } = deriveStudentRaceMoments(previous, state);
    previous = observed;
    out.push(moments.map(({ type }) => type));
  }
  return out;
}

describe("deriveStudentRaceMoments challenge offer and Turbo arm", () => {
  it("announces a new offer once, together with the correct answer that filled the meter", () => {
    expect(fired(
      runtime(),
      runtime({ offer: offer(5), activeEffect: "correct", feedbackEventId: 50 }),
      runtime({ offer: offer(5), activeEffect: "correct", feedbackEventId: 50 }),
    )).toEqual([[], ["correct", STUDENT_RACE_MOMENT.CHALLENGE_OFFER], []]);
  });

  it("treats an offer or a run already present on the first observation as a baseline (refresh, reconnect)", () => {
    expect(fired(runtime({ offer: offer(5) }), runtime({ offer: offer(5) }))).toEqual([[], []]);
    expect(fired(runtime({ run: run(5) }), runtime({ run: run(5) }))).toEqual([[], []]);
  });

  it("arms Turbo only when the server's run appears, never while the choice is still pending", () => {
    expect(fired(
      runtime({ offer: offer(6) }),
      runtime({ offer: offer(6) }),
      runtime({ run: run(6) }),
      runtime({ run: run(6) }),
    )).toEqual([[], [], [STUDENT_RACE_MOMENT.TURBO_ARMED], []]);
  });

  it("stays quiet when the accepted run is a Safe run", () => {
    expect(fired(runtime({ offer: offer(7) }), runtime({ run: run(7, "SAFE_RUN") }))).toEqual([[], []]);
  });

  it("carries the offer and the challenge identity on the moments", () => {
    const offered = deriveStudentRaceMoments(deriveStudentRaceMoments(null, runtime()).observed, runtime({ offer: offer(9) }));
    const armed = deriveStudentRaceMoments(offered.observed, runtime({ run: run(9) }));

    expect(offered.moments).toEqual([{ type: STUDENT_RACE_MOMENT.CHALLENGE_OFFER, id: "offer-9", offerId: 9 }]);
    expect(armed.moments).toEqual([{ type: STUDENT_RACE_MOMENT.TURBO_ARMED, id: "turbo-armed-9", challengeId: 9 }]);
  });

  it("never replays an offer or a run that a stale sample brings back, whatever the id order", () => {
    expect(fired(
      runtime(),
      runtime({ offer: offer(12) }),
      runtime({ run: run(12) }),
      runtime({ offer: offer(12) }),
      runtime({ run: run(12) }),
      runtime({ offer: offer(4) }),
    )).toEqual([[], [STUDENT_RACE_MOMENT.CHALLENGE_OFFER], [STUDENT_RACE_MOMENT.TURBO_ARMED], [], [],
      [STUDENT_RACE_MOMENT.CHALLENGE_OFFER]]);
  });

  it("never leaks an offer or a run across a race or player switch", () => {
    expect(fired(
      runtime({ offer: offer(20) }),
      runtime({ raceId: 8, offer: offer(21) }),
      runtime({ raceId: 8, racePlayerId: 2, run: run(22) }),
      runtime({ raceId: 8, racePlayerId: 2, offer: offer(23) }),
    )).toEqual([[], [], [], [STUDENT_RACE_MOMENT.CHALLENGE_OFFER]]);
  });

  it("lets the finish silence an offer that arrives with it", () => {
    expect(fired(runtime(), runtime({ offer: offer(30), playerFinished: true }))).toEqual([[], [STUDENT_RACE_MOMENT.FINISH]]);
  });

  it("keeps only the finish when a fresh offer, a Turbo run and a result all arrive with it", () => {
    const everything = runtime({ run: run(41), playerFinished: true });
    everything.gameplay.challenge.offer = offer(42);
    everything.gameplay.challenge.lastResult = { challengeId: 40, type: "TURBO_TRIAL", outcome: "TURBO_SUCCESS",
      questionsResolved: 1, correctAnswers: 1, completedAtEpochMs: 1 };

    expect(fired(runtime(), everything)).toEqual([[], [STUDENT_RACE_MOMENT.FINISH]]);
  });

  it("does not replay an offer that comes back after a reconnect gap without a race or without gameplay", () => {
    const noRace = { ...runtime({ offer: offer(5) }), race: null };
    const noGameplay = { ...runtime(), gameplay: undefined };

    expect(fired(runtime(), runtime({ offer: offer(5) }), noRace, runtime({ offer: offer(5) }))).toEqual([[],
      [STUDENT_RACE_MOMENT.CHALLENGE_OFFER], [], []]);
    expect(fired(runtime(), runtime({ offer: offer(6) }), noGameplay, runtime({ offer: offer(6) }))).toEqual([[],
      [STUDENT_RACE_MOMENT.CHALLENGE_OFFER], [], []]);
  });

  it("ignores a malformed offer or run without crashing", () => {
    expect(fired(
      runtime(),
      runtime({ offer: { offerId: "x" } }),
      runtime({ run: { challengeId: null, type: "TURBO_TRIAL" } }),
    )).toEqual([[], [], []]);
  });

  it("keeps its memory bounded across a long race", () => {
    let previous = deriveStudentRaceMoments(null, runtime()).observed;
    for (let id = 1; id <= 300; id += 1) {
      previous = deriveStudentRaceMoments(previous, runtime({ offer: offer(id) })).observed;
      previous = deriveStudentRaceMoments(previous, runtime({ run: run(id) })).observed;
    }

    expect(previous.seenOfferIds.size).toBeLessThanOrEqual(64);
    expect(previous.seenRunIds.size).toBeLessThanOrEqual(64);
  });
});
