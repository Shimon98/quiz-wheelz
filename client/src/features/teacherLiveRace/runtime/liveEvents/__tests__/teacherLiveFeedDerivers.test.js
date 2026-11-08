import { describe, expect, it } from "vitest";

import { applyTeacherLiveEvent } from "../applyTeacherLiveEvent";
import { mapTeacherLiveEventEnvelope } from "../mapTeacherLiveEventEnvelope";
import { mapTeacherRaceLiveState } from "../../mapTeacherRaceLiveState";
import {
  teacherLiveEvent,
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../teacherRaceLiveTestFixtures";
import { TEACHER_FEED_KINDS, TEACHER_FEED_MESSAGE_KEYS } from "../../../config/teacherLiveFeedConfig";
import { RACE_PUBLIC_MOMENT_KINDS } from "../../../../../constants/raceLiveEventConstants";

const runtime = mapTeacherRaceLiveState(teacherLiveStateResponse());

function feedFor(overrides, base = runtime) {
  return applyTeacherLiveEvent(base, mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides))).feedItems;
}

function answer(correct, racePlayerId = 91) {
  return feedFor({ type: "QUESTION_ANSWERED", payload: { racePlayerId, questionId: 5, correct } });
}

describe("teacher live feed derivation", () => {
  it("announces a correct answer with the player name and stays silent on a wrong one", () => {
    expect(answer(true)).toEqual([
      {
        id: "13:CORRECT_ANSWER:91",
        kind: TEACHER_FEED_KINDS.CORRECT_ANSWER,
        messageKey: "feed.correctAnswer",
        values: { name: "Noa" },
        racePlayerId: 91,
        occurredAtEpochMs: 1_755_600_001_000,
      },
    ]);
    expect(answer(false)).toEqual([]);
  });

  it("skips a correct answer from a player the runtime does not know", () => {
    expect(answer(true, 999)).toEqual([]);
  });

  it("emits rank changes from server ranks only, never rank-downs or unchanged ranks", () => {
    const items = feedFor({
      payload: {
        players: [
          teacherLivePlayer({ racePlayerId: 92, displayName: "Dan", laneNumber: 2, rank: 1, position: 200 }),
          teacherLivePlayer({ rank: 2, position: 150 }),
        ],
      },
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: TEACHER_FEED_KINDS.TOOK_LEAD,
      messageKey: "feed.tookLead",
      racePlayerId: 92,
      values: { name: "Dan" },
    });
  });

  it("emits nothing when ranks are unchanged", () => {
    expect(feedFor({})).toEqual([]);
  });

  it("announces a finisher first and rank-ups only for the other players", () => {
    const finisher = teacherLivePlayer({ racePlayerId: 92, displayName: "Dan", laneNumber: 2, rank: 1, status: "FINISHED", position: 1000 });
    const items = feedFor({
      type: "PLAYER_FINISHED",
      payload: { player: finisher, finishedAtEpochMs: 1_755_600_050_000, players: [finisher, teacherLivePlayer({ rank: 2 })] },
    });

    expect(items.map((item) => item.kind)).toEqual([TEACHER_FEED_KINDS.PLAYER_FINISHED]);
    expect(items[0].values).toEqual({ name: "Dan" });
  });

  it("announces the race finish as one race-scoped item", () => {
    const items = feedFor({
      type: "RACE_FINISHED",
      payload: { raceStatus: "FINISHED", finishedAtEpochMs: 1_755_600_090_000, players: runtime.players },
    });

    expect(items).toEqual([
      {
        id: "13:RACE_FINISHED:race",
        kind: TEACHER_FEED_KINDS.RACE_FINISHED,
        messageKey: "feed.raceFinished",
        values: {},
        racePlayerId: null,
        occurredAtEpochMs: 1_755_600_001_000,
      },
    ]);
  });

  it("emits nothing for joins, starts and unknown events", () => {
    expect(feedFor({ type: "PLAYER_JOINED", payload: { player: teacherLivePlayer({ racePlayerId: 93, laneNumber: 3 }) } })).toEqual([]);
    expect(feedFor({ type: "RACE_STARTED", payload: { raceStatus: "IN_PROGRESS", startedAtEpochMs: 1, players: runtime.players } })).toEqual([]);
    expect(feedFor({ type: "SOMETHING_NEW", payload: {} })).toEqual([]);
  });
});

// S4-06: what an answer caused is told instead of the plain "correct answer" line.
describe("public moments of an answer", () => {
  function answered(moments, { correct = true, racePlayerId = 91 } = {}) {
    return feedFor({ type: "QUESTION_ANSWERED", payload: { racePlayerId, questionId: 5, correct, moments } });
  }

  it.each(Object.values(RACE_PUBLIC_MOMENT_KINDS))("tells %s with the player's name", (kind) => {
    expect(answered([{ kind, sourceId: 5 }])).toEqual([
      {
        id: `13:${kind}:91`,
        kind,
        messageKey: TEACHER_FEED_MESSAGE_KEYS[kind],
        values: { name: "Noa" },
        racePlayerId: 91,
        occurredAtEpochMs: 1_755_600_001_000,
      },
    ]);
  });

  it("tells Luck that came with a wrong answer, and nothing else about that answer", () => {
    expect(answered([{ kind: "LUCK_MUD", sourceId: 31 }], { correct: false }).map(({ kind }) => kind))
      .toEqual([TEACHER_FEED_KINDS.LUCK_MUD]);
  });

  it("keeps every moment of one answer in the server's order", () => {
    expect(answered([{ kind: "LUCK_SHIELD_BLOCKED", sourceId: 31 }, { kind: "SHIELD_EARNED", sourceId: 5 }])
      .map(({ kind }) => kind)).toEqual([TEACHER_FEED_KINDS.LUCK_SHIELD_BLOCKED, TEACHER_FEED_KINDS.SHIELD_EARNED]);
  });

  it("skips the moments of a player the runtime does not know", () => {
    expect(answered([{ kind: "TURBO_SUCCESS", sourceId: 12 }], { racePlayerId: 999 })).toEqual([]);
  });
});

// Leads, ranks and streaks come from two server rosters; the client never ranks anyone itself.
describe("roster moments", () => {
  const noa = (overrides) => teacherLivePlayer(overrides);
  const dan = (overrides) =>
    teacherLivePlayer({ racePlayerId: 92, displayName: "Dan", laneNumber: 2, rank: 2, position: 80, streak: 0, ...overrides });
  const gil = (overrides) =>
    teacherLivePlayer({ racePlayerId: 93, displayName: "Gil", laneNumber: 3, rank: 3, position: 60, streak: 4, ...overrides });
  const trio = (players = [noa(), dan(), gil()]) => mapTeacherRaceLiveState(teacherLiveStateResponse({ players }));
  const progress = (players, base = trio()) => feedFor({ payload: { players } }, base);
  const told = (items) => items.map(({ kind, racePlayerId, values }) => [kind, racePlayerId, values]);

  it("tells a new leader once, instead of a plain rank-up", () => {
    expect(progress([dan({ rank: 1, position: 130 }), noa({ rank: 2 }), gil()])).toEqual([
      {
        id: "13:TOOK_LEAD:92",
        kind: TEACHER_FEED_KINDS.TOOK_LEAD,
        messageKey: "feed.tookLead",
        values: { name: "Dan" },
        racePlayerId: 92,
        occurredAtEpochMs: 1_755_600_001_000,
      },
    ]);
  });

  it("tells a rank-up below the lead with the new rank", () => {
    expect(told(progress([noa(), gil({ rank: 2, position: 90 }), dan({ rank: 3 })])))
      .toEqual([[TEACHER_FEED_KINDS.RANK_UP, 93, { name: "Gil", rank: 2 }]]);
  });

  it("tells a shared first place for the player who reached it, not for the one already there", () => {
    expect(told(progress([noa(), dan({ rank: 1, position: 120.5 }), gil()])))
      .toEqual([[TEACHER_FEED_KINDS.TOOK_LEAD, 92, { name: "Dan" }]]);
  });

  it("tells a streak of 5 and of 10 when the server's streak reaches it", () => {
    expect(told(progress([noa(), dan(), gil({ streak: 5 })])))
      .toEqual([[TEACHER_FEED_KINDS.STREAK, 93, { name: "Gil", count: 5 }]]);
    expect(told(progress([noa(), dan(), gil({ streak: 10 })], trio([noa(), dan(), gil({ streak: 9 })]))))
      .toEqual([[TEACHER_FEED_KINDS.STREAK, 93, { name: "Gil", count: 10 }]]);
    expect(told(progress([noa(), dan(), gil({ streak: 6 })])))
      .toEqual([[TEACHER_FEED_KINDS.STREAK, 93, { name: "Gil", count: 5 }]]);
  });

  it("stays silent while a streak grows between milestones, past them, or breaks", () => {
    expect(progress([noa({ streak: 3 }), dan({ streak: 1 }), gil({ streak: 0 })])).toEqual([]);
    expect(progress([noa(), dan(), gil({ streak: 6 })], trio([noa(), dan(), gil({ streak: 5 })]))).toEqual([]);
    expect(progress([noa(), dan(), gil({ streak: 11 })], trio([noa(), dan(), gil({ streak: 10 })]))).toEqual([]);
  });

  it("tells a lead and a streak of the same student as two candidates for the feed to choose from", () => {
    expect(told(progress([gil({ rank: 1, position: 130, streak: 5 }), noa({ rank: 2 }), dan({ rank: 3 })])))
      .toEqual([
        [TEACHER_FEED_KINDS.TOOK_LEAD, 93, { name: "Gil" }],
        [TEACHER_FEED_KINDS.STREAK, 93, { name: "Gil", count: 5 }],
      ]);
  });

  it("leaves the finisher's own streak to the finish line", () => {
    const finisher = gil({ rank: 1, status: "FINISHED", position: 1000, streak: 5 });
    expect(feedFor({
      type: "PLAYER_FINISHED",
      payload: { player: finisher, finishedAtEpochMs: 1_755_600_050_000, players: [finisher, noa({ rank: 2 }), dan({ rank: 3 })] },
    }, trio()).map(({ kind }) => kind)).toEqual([TEACHER_FEED_KINDS.PLAYER_FINISHED]);
  });
});
