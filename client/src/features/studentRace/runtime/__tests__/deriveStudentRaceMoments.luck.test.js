import { describe, expect, it } from "vitest";

import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import { deriveStudentRaceMoments, presentedMoments } from "../deriveStudentRaceMoments";

function luckEvent(eventId, appliedType = "TAILWIND", { outcome = "APPLIED", selectedType = appliedType } = {}) {
  return { eventId, selectedType, appliedType, outcome, occurredAtEpochMs: 50_000 + eventId };
}

function runtime({ luck = [], shield = 0, raceId = 7, racePlayerId = 1, playerFinished = false,
  activeEffect = null, feedbackEventId = null, activeEffects = [], lastResult = null } = {}) {
  return {
    race: { id: raceId },
    player: { racePlayerId },
    playerFinished,
    visual: { activeEffect, feedbackEventId, feedbackStreak: 0, timeUpQuestionId: null },
    gameplay: {
      mode: "NORMAL",
      effectiveSpeed: 1,
      activeEffects,
      challenge: { energy: 0, threshold: 100, offer: null, run: null, lastResult },
      powerUps: { guardShieldCharges: shield, guardShieldAwardQuestionId: shield > 0 ? 70 : null },
      luck: { recentEvents: luck },
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

describe("deriveStudentRaceMoments Luck events", () => {
  it("announces a new Luck event once, carrying its server id", () => {
    const baseline = deriveStudentRaceMoments(null, runtime());
    const first = deriveStudentRaceMoments(baseline.observed, runtime({ luck: [luckEvent(31)] }));
    const again = deriveStudentRaceMoments(first.observed, runtime({ luck: [luckEvent(31)] }));

    expect(first.moments).toEqual([{ type: STUDENT_RACE_MOMENT.LUCK_TAILWIND, id: "luck-31", luckEventId: 31 }]);
    expect(again.moments).toEqual([]);
  });

  it.each([
    ["TAILWIND", STUDENT_RACE_MOMENT.LUCK_TAILWIND],
    ["ENERGY_ORB", STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB],
    ["MUD_SPLASH", STUDENT_RACE_MOMENT.LUCK_MUD],
  ])("names an applied %s by the type the server applied", (appliedType, moment) => {
    expect(fired(runtime(), runtime({ luck: [luckEvent(31, appliedType)] }))).toEqual([[], [moment]]);
  });

  it("presents a Tailwind that became an Energy Orb at top speed as the Orb", () => {
    expect(fired(runtime(), runtime({ luck: [luckEvent(31, "ENERGY_ORB", { selectedType: "TAILWIND" })] })))
      .toEqual([[], [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB]]);
  });

  it("presents mud the shield stopped as a block, never as a hit", () => {
    expect(fired(
      runtime({ shield: 1 }),
      runtime({ luck: [luckEvent(31, "MUD_SPLASH", { outcome: "BLOCKED_BY_SHIELD" })] }),
    )).toEqual([[], [STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED]]);
  });

  it("never invents a block or a Luck event from the shield count or from a speed effect", () => {
    const luckySlowdown = {
      effectId: 5, type: "SPEED_SLOW", source: "LUCK_EVENT", magnitudeTenths: 2, startsAtEpochMs: 1, endsAtEpochMs: 2,
    };

    expect(fired(
      runtime({ shield: 1 }),
      runtime({ shield: 0 }),
      runtime({ activeEffects: [luckySlowdown] }),
    )).toEqual([[], [], []]);
  });

  it("treats the Luck history already present on the first observation as a baseline", () => {
    const history = [luckEvent(31), luckEvent(32, "MUD_SPLASH")];

    expect(fired(runtime({ luck: history }), runtime({ luck: history }))).toEqual([[], []]);
  });

  it("announces two new events of one sample once each, in the order the server listed them", () => {
    const both = [luckEvent(31), luckEvent(32, "MUD_SPLASH")];

    expect(fired(runtime(), runtime({ luck: both }), runtime({ luck: both })))
      .toEqual([[], [STUDENT_RACE_MOMENT.LUCK_TAILWIND, STUDENT_RACE_MOMENT.LUCK_MUD], []]);
  });

  it("announces each event once even when a lower id shows up after a higher one", () => {
    expect(fired(
      runtime(),
      runtime({ luck: [luckEvent(32, "MUD_SPLASH")] }),
      runtime({ luck: [luckEvent(31), luckEvent(32, "MUD_SPLASH")] }),
      runtime({ luck: [luckEvent(32, "MUD_SPLASH"), luckEvent(31)] }),
      runtime({ luck: [luckEvent(31)] }),
    )).toEqual([[], [STUDENT_RACE_MOMENT.LUCK_MUD], [STUDENT_RACE_MOMENT.LUCK_TAILWIND], [], []]);
  });

  it("plays nothing for an outcome or a type it cannot present, without crashing", () => {
    expect(fired(
      runtime(),
      runtime({ luck: [
        luckEvent(41, "FUTURE_TYPE"),
        luckEvent(42, "TAILWIND", { outcome: "NO_EFFECT" }),
        luckEvent(43, "MUD_SPLASH", { outcome: "NO_EVENT" }),
        luckEvent(44, "TAILWIND", { outcome: "BLOCKED_BY_SHIELD" }),
        { eventId: "x", appliedType: "TAILWIND", outcome: "APPLIED" },
        null,
      ] }),
    )).toEqual([[], []]);
  });

  it("starts a new baseline for another race or player, where a reused id still plays", () => {
    expect(fired(
      runtime({ luck: [luckEvent(31)] }),
      runtime({ raceId: 8, luck: [luckEvent(50)] }),
      runtime({ raceId: 8, racePlayerId: 2, luck: [luckEvent(60)] }),
      runtime({ raceId: 8, racePlayerId: 2, luck: [luckEvent(60), luckEvent(31, "MUD_SPLASH")] }),
    )).toEqual([[], [], [], [STUDENT_RACE_MOMENT.LUCK_MUD]]);
  });

  it("lets the finish outrank Luck that arrives with it and never replays that Luck later", () => {
    expect(fired(
      runtime(),
      runtime({ luck: [luckEvent(31)], playerFinished: true }),
      runtime({ luck: [luckEvent(31), luckEvent(32, "MUD_SPLASH")], playerFinished: true }),
    )).toEqual([[], [STUDENT_RACE_MOMENT.FINISH], []]);
  });

  it("announces the answer first and then the Luck it drew, in one batch", () => {
    expect(fired(runtime(), runtime({ activeEffect: "correct", feedbackEventId: 400, luck: [luckEvent(31)] })))
      .toEqual([[], ["correct", STUDENT_RACE_MOMENT.LUCK_TAILWIND]]);
  });

  it("presents Luck that arrives with a challenge result next to the result, never losing it", () => {
    const lastResult = {
      challengeId: 9, type: "TURBO_TRIAL", outcome: "TURBO_FAILURE", questionsResolved: 1, correctAnswers: 0,
      completedAtEpochMs: 1,
    };
    const blocked = luckEvent(31, "MUD_SPLASH", { outcome: "BLOCKED_BY_SHIELD" });
    const { moments } = deriveStudentRaceMoments(deriveStudentRaceMoments(null, runtime()).observed,
      runtime({ activeEffect: "wrong", feedbackEventId: 400, luck: [blocked], lastResult }));

    expect(presentedMoments({ moments }).map(({ type }) => type))
      .toEqual([STUDENT_RACE_MOMENT.TURBO_FAILURE, STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED]);
  });

  it("keeps its Luck memory bounded across a long race", () => {
    let previous = deriveStudentRaceMoments(null, runtime()).observed;
    for (let id = 1; id <= 300; id += 1) {
      previous = deriveStudentRaceMoments(previous, runtime({ luck: [luckEvent(id)] })).observed;
    }

    expect(previous.seenLuckEventIds.size).toBeLessThanOrEqual(64);
  });
});
