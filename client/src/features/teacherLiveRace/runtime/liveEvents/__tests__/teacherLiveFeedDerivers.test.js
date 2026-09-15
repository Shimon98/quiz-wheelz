import { describe, expect, it } from "vitest";

import { applyTeacherLiveEvent } from "../applyTeacherLiveEvent";
import { mapTeacherLiveEventEnvelope } from "../mapTeacherLiveEventEnvelope";
import { mapTeacherRaceLiveState } from "../../mapTeacherRaceLiveState";
import {
  teacherLiveEvent,
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../teacherRaceLiveTestFixtures";
import { TEACHER_FEED_KINDS } from "../../../config/teacherLiveFeedConfig";

const runtime = mapTeacherRaceLiveState(teacherLiveStateResponse());

function feedFor(overrides) {
  return applyTeacherLiveEvent(runtime, mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides))).feedItems;
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

  it("emits rank-ups from server ranks only, never rank-downs or unchanged ranks", () => {
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
      kind: TEACHER_FEED_KINDS.RANK_UP,
      messageKey: "feed.rankUp",
      racePlayerId: 92,
      values: { name: "Dan", rank: 1 },
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
