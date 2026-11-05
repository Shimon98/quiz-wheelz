import { describe, expect, it } from "vitest";

import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { STUDENT_RACE_MOMENT } from "../studentRaceRuntimeConstants";
import { deriveStudentRaceMoments, newestRankMoment } from "../deriveStudentRaceMoments";

const S = 1_789_034_411_000;
const GAP_MS = STUDENT_RACE_CONFIG.rankMomentMinGapMs;

// Only what rank news reads: the server's rank and the server time of the accepted snapshot that carried it.
function runtime({ rank = 3, at = S, raceId = 7, racePlayerId = 1, playerFinished = false } = {}) {
  return {
    race: { id: raceId },
    player: { racePlayerId, rank },
    playerFinished,
    lastSnapshotAtEpochMs: at,
    visual: { activeEffect: null, feedbackEventId: null, feedbackStreak: 0, timeUpQuestionId: null },
  };
}

function moments(...runtimes) {
  let previous = null;
  return runtimes.map((state) => {
    const result = deriveStudentRaceMoments(previous, state);
    previous = result.observed;
    return result.moments;
  });
}

const types = (...runtimes) => moments(...runtimes).map((batch) => batch.map(({ type }) => type));

describe("deriveStudentRaceMoments rank news", () => {
  it("takes the first sight of a race player as a baseline, even in first place", () => {
    expect(types(runtime({ rank: 1 }))).toEqual([[]]);
  });

  it("tells a climb once, with the new place and an id from the server time of its snapshot", () => {
    const climbed = runtime({ rank: 2, at: S + 2_000 });

    expect(moments(runtime({ rank: 3 }), climbed, climbed)).toEqual([
      [],
      [{ type: STUDENT_RACE_MOMENT.RANK_UP, id: `rank-${S + 2_000}`, rank: 2, identity: "7:1" }],
      [],
    ]);
  });

  it("tells reaching first place as taking the lead", () => {
    expect(types(runtime({ rank: 2 }), runtime({ rank: 1, at: S + 2_000 })))
      .toEqual([[], [STUDENT_RACE_MOMENT.TOOK_LEAD]]);
  });

  it("stays silent on a drop, an unchanged place and an unknown place", () => {
    expect(types(
      runtime({ rank: 2 }),
      runtime({ rank: 3, at: S + 2_000 }),
      runtime({ rank: 3, at: S + 4_000 }),
      runtime({ rank: null, at: S + 6_000 }),
      runtime({ rank: 2, at: S + 8_000 }),
    )).toEqual([[], [], [], [], []]);
  });

  it("tells one climb per gap of server time and never tells a muted climb later", () => {
    expect(types(
      runtime({ rank: 4 }),
      runtime({ rank: 3, at: S + 1_000 }),
      runtime({ rank: 2, at: S + 1_000 + GAP_MS - 1 }),
      runtime({ rank: 2, at: S + 1_000 + GAP_MS + 500 }),
      runtime({ rank: 1, at: S + 1_000 + GAP_MS + 1_000 }),
    )).toEqual([[], [STUDENT_RACE_MOMENT.RANK_UP], [], [], [STUDENT_RACE_MOMENT.TOOK_LEAD]]);
  });

  it("leaves the finish line to the finish", () => {
    expect(types(runtime({ rank: 3 }), runtime({ rank: 1, at: S + 2_000, playerFinished: true })))
      .toEqual([[], [STUDENT_RACE_MOMENT.FINISH]]);
  });

  it("starts again from a baseline for another player or another race", () => {
    expect(types(
      runtime({ rank: 3 }),
      runtime({ rank: 1, at: S + 2_000, racePlayerId: 2 }),
      runtime({ rank: 1, at: S + 4_000, raceId: 8, racePlayerId: 2 }),
    )).toEqual([[], [], []]);
  });

  it("hands the newest rank news of a batch to the notice line", () => {
    const climb = { type: STUDENT_RACE_MOMENT.RANK_UP, id: "rank-2", rank: 2, identity: "7:1" };

    expect(newestRankMoment({ moments: [{ type: STUDENT_RACE_MOMENT.CORRECT, id: 5 }, climb] })).toBe(climb);
    expect(newestRankMoment({ moments: [{ type: STUDENT_RACE_MOMENT.LUCK_MUD, id: "luck-3" }] })).toBeNull();
  });
});
