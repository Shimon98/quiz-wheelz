import { describe, expect, it } from "vitest";

import { ApiContractError } from "../../../../errors/ApiContractError";
import { mapTeacherRaceResults } from "../mapTeacherRaceResults";
import { teacherRaceResultsResponse, teacherResultPlayer } from "../teacherRaceResultsTestFixtures";

function mapWith(overrides) {
  return () => mapTeacherRaceResults(teacherRaceResultsResponse(overrides));
}

describe("mapTeacherRaceResults", () => {
  it("maps a finished race and keeps the server player order untouched", () => {
    const results = mapTeacherRaceResults(teacherRaceResultsResponse());

    expect(results.players.map((player) => player.racePlayerId)).toEqual([11, 12, 13, 14]);
    expect(results.subject).toEqual({ name: "Math", code: "MATH" });
    expect(results.winnerRacePlayerIds).toEqual([11]);
    expect(results.players[3]).toMatchObject({ status: "DISCONNECTED", finishedAtEpochMs: null });
  });

  it("keeps competition ranks and every tied winner exactly as sent", () => {
    const players = [
      teacherResultPlayer(),
      teacherResultPlayer({ racePlayerId: 12, displayName: "Maya", laneNumber: 2, rank: 1 }),
      teacherResultPlayer({
        racePlayerId: 13,
        displayName: "Dan",
        laneNumber: 3,
        rank: 3,
        finishedAtEpochMs: 1_760_000_150_000,
      }),
    ];
    const results = mapTeacherRaceResults(
      teacherRaceResultsResponse({ players, winnerRacePlayerIds: [11, 12] }),
    );

    expect(results.players.map((player) => player.rank)).toEqual([1, 1, 3]);
    expect(results.winnerRacePlayerIds).toEqual([11, 12]);
  });

  it("accepts a race without winners and without awards", () => {
    const results = mapTeacherRaceResults(
      teacherRaceResultsResponse({ winnerRacePlayerIds: [], awards: [] }),
    );

    expect(results.winnerRacePlayerIds).toEqual([]);
    expect(results.awards).toEqual([]);
  });

  it("accepts a finisher that has no finish time", () => {
    const players = [teacherResultPlayer({ finishedAtEpochMs: null })];

    expect(mapWith({ players })().players[0].finishedAtEpochMs).toBeNull();
  });

  it("accepts a finished race whose start and finish times are missing, as the server allows", () => {
    const results = mapWith({ startedAtEpochMs: null, finishedAtEpochMs: null })();

    expect(results.startedAtEpochMs).toBeNull();
    expect(results.finishedAtEpochMs).toBeNull();
  });

  it.each([
    ["an unfinished race", { status: "IN_PROGRESS" }],
    ["a repeated player", { players: [teacherResultPlayer(), teacherResultPlayer()] }],
    ["a winner outside the roster", { winnerRacePlayerIds: [99] }],
    ["a repeated winner", { winnerRacePlayerIds: [11, 11] }],
    ["an award for an unknown player", { awards: [{ type: "HIGHEST_SCORE", racePlayerIds: [99], value: 5 }] }],
    ["an award without players", { awards: [{ type: "HIGHEST_SCORE", racePlayerIds: [], value: 5 }] }],
    ["a zero-value award", { awards: [{ type: "HIGHEST_SCORE", racePlayerIds: [11], value: 0 }] }],
    ["an unknown award type", { awards: [{ type: "FASTEST_LAP", racePlayerIds: [11], value: 5 }] }],
    [
      "a repeated award type",
      {
        awards: [
          { type: "HIGHEST_SCORE", racePlayerIds: [11], value: 920 },
          { type: "HIGHEST_SCORE", racePlayerIds: [12], value: 840 },
        ],
      },
    ],
    ["a player count that does not match", { playerCount: 9 }],
    ["a non-finisher with a finish time", { players: [teacherResultPlayer({ status: "DISCONNECTED" })] }],
    ["an unknown player status", { players: [teacherResultPlayer({ status: "GHOST" })] }],
    ["a malformed start time", { startedAtEpochMs: "soon" }],
    ["a missing title", { title: "" }],
    ["a missing summary", { summary: null }],
    ["a missing subject", { subject: null }],
  ])("rejects %s", (_label, overrides) => {
    expect(mapWith(overrides)).toThrow(ApiContractError);
  });
});
