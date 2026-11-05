import { describe, expect, it } from "vitest";

import {
  mapPlayerFinishedPayload,
  mapPlayerJoinedPayload,
  mapPlayerProgressUpdatedPayload,
  mapQuestionAnsweredPayload,
  mapRaceFinishedPayload,
  mapRaceStartedPayload,
} from "../teacherLiveEventPayloadMappers";
import { teacherLivePlayer } from "../../teacherRaceLiveTestFixtures";
import { ApiContractError } from "../../../../../errors/ApiContractError";

const roster = [teacherLivePlayer(), teacherLivePlayer({ racePlayerId: 92, laneNumber: 2, rank: 2 })];

describe("teacher live event payload mappers", () => {
  it("maps every known payload to its validated shape", () => {
    expect(mapPlayerJoinedPayload({ player: teacherLivePlayer() }).player.racePlayerId).toBe(91);

    const started = mapRaceStartedPayload({
      raceStatus: "IN_PROGRESS",
      startedAtEpochMs: 1_755_600_000_000,
      players: roster,
    });
    expect(started.raceStatus).toBe("IN_PROGRESS");
    expect(started.startedAtEpochMs).toBe(1_755_600_000_000);
    expect(started.players).toHaveLength(2);

    expect(
      mapQuestionAnsweredPayload({ racePlayerId: 91, questionId: 4, correct: false }),
    ).toEqual({ racePlayerId: 91, questionId: 4, correct: false, moments: [] });

    expect(mapPlayerProgressUpdatedPayload({ players: roster }).players).toHaveLength(2);

    const finished = mapPlayerFinishedPayload({
      player: teacherLivePlayer({ status: "FINISHED" }),
      finishedAtEpochMs: 1_755_600_050_000,
      players: roster,
    });
    expect(finished.player.status).toBe("FINISHED");
    expect(finished.finishedAtEpochMs).toBe(1_755_600_050_000);

    const raceFinished = mapRaceFinishedPayload({
      raceStatus: "FINISHED",
      finishedAtEpochMs: 1_755_600_090_000,
      players: roster,
    });
    expect(raceFinished.raceStatus).toBe("FINISHED");
    expect(raceFinished.players).toHaveLength(2);
  });

  it.each([
    ["PLAYER_JOINED without player", () => mapPlayerJoinedPayload({})],
    ["RACE_STARTED with unknown status", () =>
      mapRaceStartedPayload({ raceStatus: "PAUSED", startedAtEpochMs: 1, players: roster })],
    ["RACE_STARTED with a contradictory FINISHED status", () =>
      mapRaceStartedPayload({ raceStatus: "FINISHED", startedAtEpochMs: 1, players: roster })],
    ["RACE_STARTED with a contradictory CANCELLED status", () =>
      mapRaceStartedPayload({ raceStatus: "CANCELLED", startedAtEpochMs: 1, players: roster })],
    ["RACE_FINISHED with a contradictory READY status", () =>
      mapRaceFinishedPayload({ raceStatus: "READY", finishedAtEpochMs: 1, players: roster })],
    ["RACE_FINISHED with a contradictory IN_PROGRESS status", () =>
      mapRaceFinishedPayload({ raceStatus: "IN_PROGRESS", finishedAtEpochMs: 1, players: roster })],
    ["RACE_STARTED without start epoch", () =>
      mapRaceStartedPayload({ raceStatus: "IN_PROGRESS", startedAtEpochMs: null, players: roster })],
    ["QUESTION_ANSWERED with string correct", () =>
      mapQuestionAnsweredPayload({ racePlayerId: 91, questionId: 4, correct: "true" })],
    ["PLAYER_PROGRESS_UPDATED with null players", () =>
      mapPlayerProgressUpdatedPayload({ players: null })],
    ["PLAYER_FINISHED with zero finish epoch", () =>
      mapPlayerFinishedPayload({ player: teacherLivePlayer(), finishedAtEpochMs: 0, players: roster })],
    ["RACE_FINISHED with duplicate players", () =>
      mapRaceFinishedPayload({
        raceStatus: "FINISHED",
        finishedAtEpochMs: 1,
        players: [teacherLivePlayer(), teacherLivePlayer({ laneNumber: 2 })],
      })],
    ["null payload", () => mapQuestionAnsweredPayload(null)],
  ])("rejects %s", (_label, call) => {
    expect(call).toThrow(ApiContractError);
  });
});

// S4-06: the public moments of an answer. One bad moment never costs the answer itself or the rest of the stream.
describe("QUESTION_ANSWERED public moments", () => {
  const answered = (moments) => mapQuestionAnsweredPayload({ racePlayerId: 91, questionId: 4, correct: true, moments });

  it("keeps every moment the client knows, in the server's order", () => {
    expect(answered([{ kind: "LUCK_SHIELD_BLOCKED", sourceId: 31 }, { kind: "SHIELD_EARNED", sourceId: 4 }]).moments)
      .toEqual([{ kind: "LUCK_SHIELD_BLOCKED", sourceId: 31 }, { kind: "SHIELD_EARNED", sourceId: 4 }]);
  });

  it("reads an event written before the moments existed as having none", () => {
    expect(answered(undefined).moments).toEqual([]);
    expect(answered(null).moments).toEqual([]);
  });

  it("drops a moment of a newer kind, or a broken one, and keeps the answer", () => {
    expect(answered([
      { kind: "COMET", sourceId: 1 },
      { kind: "LUCK_TAILWIND", sourceId: "7" },
      { kind: "LUCK_MUD" },
      null,
      { kind: "TURBO_SUCCESS", sourceId: 12 },
    ])).toEqual({ racePlayerId: 91, questionId: 4, correct: true, moments: [{ kind: "TURBO_SUCCESS", sourceId: 12 }] });
    expect(answered("LUCK_TAILWIND").moments).toEqual([]);
  });
});
