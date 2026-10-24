import { describe, expect, it } from "vitest";

import { createLocalStudentRaceChallenge } from "../localStudentRaceChallenge";

const NOW = 1_800_000_000_000;

function openOffer(challenge) {
  for (let answer = 0; answer < 4; answer += 1) challenge.answer(true, NOW);
}

describe("createLocalStudentRaceChallenge (DEV only)", () => {
  it("fills energy from correct normal answers and opens an offer at the threshold", () => {
    const challenge = createLocalStudentRaceChallenge();
    challenge.answer(true, NOW);
    challenge.answer(false, NOW);

    expect(challenge.snapshot().energy).toBe(25);

    openOffer(challenge);

    expect(challenge.mode()).toBe("CHALLENGE_CHOICE");
    expect(challenge.snapshot()).toMatchObject({ energy: 0, offer: { offerId: 1, expiresAtEpochMs: NOW + 12000 } });
  });

  it("runs one Turbo question and records its result before returning to normal", () => {
    const challenge = createLocalStudentRaceChallenge();
    openOffer(challenge);

    expect(challenge.choose("TURBO_TRIAL")).toBe(true);
    expect(challenge.mode()).toBe("TURBO_TRIAL");

    challenge.answer(false, NOW + 5000);

    expect(challenge.mode()).toBe("NORMAL");
    expect(challenge.snapshot().lastResult).toMatchObject({ type: "TURBO_TRIAL", outcome: "TURBO_FAILURE" });
  });

  it("runs three Safe questions and marks a perfect run", () => {
    const challenge = createLocalStudentRaceChallenge();
    openOffer(challenge);
    challenge.choose("SAFE_RUN");
    challenge.answer(true, NOW);
    challenge.answer(true, NOW);

    expect(challenge.snapshot().run).toMatchObject({ questionsResolved: 2, totalQuestions: 3 });

    challenge.answer(true, NOW);

    expect(challenge.snapshot().lastResult.outcome).toBe("SAFE_PERFECT");
  });

  it("lets a missed offer expire into restored energy and a short slowdown", () => {
    const challenge = createLocalStudentRaceChallenge();
    openOffer(challenge);
    challenge.advanceTo(NOW + 12000);

    expect(challenge.mode()).toBe("NORMAL");
    expect(challenge.snapshot().energy).toBe(50);
    expect(challenge.activeEffects(NOW + 13000)).toMatchObject([{ type: "SPEED_SLOW", source: "CHALLENGE_TIMEOUT" }]);
    expect(challenge.activeEffects(NOW + 16000)).toEqual([]);
  });
});
