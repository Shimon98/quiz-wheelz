import { describe, expect, it } from "vitest";

import { mapStudentRaceChallenge } from "../mapStudentRaceChallenge";

function offer(overrides = {}) {
  return { offerId: 17, expiresAtEpochMs: 1_800_000_012_000, choices: ["TURBO_TRIAL", "SAFE_RUN"], ...overrides };
}

function run(overrides = {}) {
  return { challengeId: 17, type: "SAFE_RUN", questionsResolved: 1, totalQuestions: 3, correctAnswers: 1, ...overrides };
}

function lastResult(overrides = {}) {
  return {
    challengeId: 12,
    type: "TURBO_TRIAL",
    outcome: "TURBO_SUCCESS",
    questionsResolved: 1,
    correctAnswers: 1,
    completedAtEpochMs: 1_800_000_000_000,
    ...overrides,
  };
}

function challenge(overrides = {}) {
  return { energy: 75, threshold: 100, offer: null, run: null, lastResult: null, ...overrides };
}

describe("mapStudentRaceChallenge", () => {
  it("maps every part and stamps the offer with the snapshot clock offset", () => {
    expect(mapStudentRaceChallenge(
      challenge({ energy: 0, offer: offer(), lastResult: lastResult() }),
      { serverClockOffsetMs: -240 },
    )).toEqual({
      energy: 0,
      threshold: 100,
      offer: { ...offer(), serverClockOffsetMs: -240 },
      run: null,
      lastResult: lastResult(),
    });
  });

  it("keeps a run and a permanent last result as the server sent them", () => {
    const mapped = mapStudentRaceChallenge(challenge({ run: run(), lastResult: lastResult() }));

    expect(mapped.run).toEqual(run());
    expect(mapped.lastResult).toEqual(lastResult());
  });

  it("keeps only the choices it can present, once each, in server order", () => {
    const mapped = mapStudentRaceChallenge(challenge({
      offer: offer({ choices: ["FUTURE_CHOICE", "SAFE_RUN", "SAFE_RUN", "TURBO_TRIAL"] }),
    }));

    expect(mapped.offer.choices).toEqual(["SAFE_RUN", "TURBO_TRIAL"]);
  });

  it.each([
    ["an offer without a known choice", { offer: offer({ choices: ["FUTURE_CHOICE"] }) }, "offer"],
    ["an offer without an id", { offer: offer({ offerId: null }) }, "offer"],
    ["an offer without a deadline", { offer: offer({ expiresAtEpochMs: 0 }) }, "offer"],
    ["a run with a blank type", { run: run({ type: " " }) }, "run"],
    ["a result without an outcome", { lastResult: lastResult({ outcome: null }) }, "lastResult"],
    ["a run that resolved more questions than it has", { run: run({ questionsResolved: 4 }) }, "run"],
    ["a run with more correct answers than resolved", { run: run({ correctAnswers: 2 }) }, "run"],
    ["a result with more correct answers than resolved", { lastResult: lastResult({ correctAnswers: 2 }) },
      "lastResult"],
  ])("drops only %s and keeps the energy", (_, broken, part) => {
    const mapped = mapStudentRaceChallenge(challenge({ offer: offer(), run: run(), lastResult: lastResult(), ...broken }));

    expect(mapped[part]).toBeNull();
    expect(mapped.energy).toBe(75);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])("drops an offer whose clock offset is %s, so no deadline is guessed",
    (serverClockOffsetMs) => {
      const mapped = mapStudentRaceChallenge(challenge({ offer: offer() }), { serverClockOffsetMs });

      expect(mapped.offer).toBeNull();
      expect(mapped.energy).toBe(75);
    });

  it("keeps energy above the threshold for the HUD to clamp", () => {
    expect(mapStudentRaceChallenge(challenge({ energy: 120 })).energy).toBe(120);
  });

  it.each([
    undefined,
    null,
    "challenge",
    challenge({ threshold: 0 }),
    challenge({ energy: -5 }),
    challenge({ energy: 2.5 }),
  ])("returns null instead of inventing zero energy for %o", (raw) => {
    expect(mapStudentRaceChallenge(raw)).toBeNull();
  });
});
