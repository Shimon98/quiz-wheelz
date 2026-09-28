import { describe, expect, it } from "vitest";

import { STUDENT_RESULTS_PHASES } from "../../config/studentRaceResultsConfig";
import {
  resultsFinishOrder,
  resultsOpponent,
  resultsRuntime,
} from "../../runtime/studentRaceResultsTestFixtures";
import { buildStudentRaceResultsViewModel } from "../buildStudentRaceResultsViewModel";

const ids = (participants) => participants.map((participant) => participant.racePlayerId);

const FINAL = Object.freeze({ raceStatus: "FINISHED", raceFinished: true });

describe("buildStudentRaceResultsViewModel while watching", () => {
  it("has nothing to show before the student has a results phase", () => {
    const racing = resultsRuntime({ playerStatus: "RACING", playerFinished: false, playerFinishedAtEpochMs: null, position: 500 });

    expect(buildStudentRaceResultsViewModel(racing, null)).toBeNull();
  });

  it("ranks only confirmed finishers, in proof order, with the proof ranks untouched", () => {
    const model = buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([2, 1, 9_001], [1, 1, 9_001], [3, 3, 9_003]));

    expect(model.phase).toBe(STUDENT_RESULTS_PHASES.WATCHING);
    expect(ids(model.groups.ranked)).toEqual([2, 1, 3]);
    expect(model.groups.ranked.map((participant) => participant.rank)).toEqual([1, 1, 3]);
    expect(model.groups.ranked.find((participant) => participant.isMe)).toMatchObject({ racePlayerId: 1, rank: 1 });
  });

  it("keeps a finisher that the proof has not reached in confirming, without any rank", () => {
    const model = buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([1, 1]));

    expect(ids(model.groups.confirming)).toEqual([2, 3]);
    expect(model.groups.confirming.every((participant) => participant.rank === null)).toBe(true);
  });

  it("shows racing and out players without the provisional runtime rank", () => {
    const model = buildStudentRaceResultsViewModel(resultsRuntime(), null);

    expect(model.groups.racing).toEqual([expect.objectContaining({ racePlayerId: 4, rank: null, status: "RACING" })]);
    expect(model.groups.out).toEqual([expect.objectContaining({ racePlayerId: 5, rank: null, status: "DISCONNECTED" })]);
  });

  it("counts finishers from runtime statuses, not from how many the proof confirmed", () => {
    const runtime = resultsRuntime({
      playerCount: 8,
      opponents: [
        resultsOpponent(2, "FINISHED", 2),
        resultsOpponent(3, "FINISHED", 3),
        resultsOpponent(4, "RACING", 4),
        resultsOpponent(5, "RACING", 5),
        resultsOpponent(6, "RACING", 6),
        resultsOpponent(7, "RACING", 7),
        resultsOpponent(8, "DISCONNECTED", 8),
      ],
    });
    const model = buildStudentRaceResultsViewModel(runtime, resultsFinishOrder([1, 1], [2, 2]));

    expect(model.counts).toEqual({ finished: 3, racing: 4, out: 1 });
    expect(model.playerCount).toBe(8);
    expect(model.groups.ranked).toHaveLength(2);
  });

  it("does not confirm my own place until the proof includes me", () => {
    const unconfirmed = buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([2, 1, 9_000]));
    const confirmed = buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([2, 1, 9_000], [1, 2, 9_001]));

    expect(unconfirmed.me).toMatchObject({ finished: true, rankConfirmed: false, rank: null });
    expect(confirmed.me).toMatchObject({ finished: true, rankConfirmed: true, rank: 2, rankTied: false });
  });

  it("reports my confirmed tie from the proof", () => {
    const model = buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([2, 1, 9_001], [1, 1, 9_001]));

    expect(model.me).toMatchObject({ rank: 1, rankTied: true });
  });

  it("carries my own score and streak while never inventing private data for opponents", () => {
    const model = buildStudentRaceResultsViewModel(resultsRuntime({ score: 920, highestStreak: 7 }), null);
    const opponents = Object.values(model.groups).flat().filter((participant) => !participant.isMe);

    expect(model.me).toMatchObject({ score: 920, highestStreak: 7 });
    for (const participant of opponents) {
      for (const field of ["score", "correctAnswers", "wrongAnswers", "streak", "highestStreak"]) {
        expect(participant).not.toHaveProperty(field);
      }
    }
  });

  it("asks for passive sync only while watching", () => {
    const watching = buildStudentRaceResultsViewModel(resultsRuntime(), null);
    const final = buildStudentRaceResultsViewModel(resultsRuntime(FINAL), null);

    expect([watching.passiveSyncNeeded, watching.raceFinished]).toEqual([true, false]);
    expect([final.passiveSyncNeeded, final.raceFinished]).toEqual([false, true]);
  });
});

describe("buildStudentRaceResultsViewModel once the race is final", () => {
  it("uses the final server ranks and keeps ties together without a fake order", () => {
    const runtime = resultsRuntime({
      ...FINAL,
      rank: 1,
      playerCount: 5,
      opponents: [
        resultsOpponent(2, "FINISHED", 1),
        resultsOpponent(3, "FINISHED", 3),
        resultsOpponent(4, "FINISHED", 4),
        resultsOpponent(5, "DISCONNECTED", 5),
      ],
    });
    const model = buildStudentRaceResultsViewModel(runtime, null);

    expect(model.phase).toBe(STUDENT_RESULTS_PHASES.FINAL);
    expect(model.finalCohorts.map((cohort) => [cohort.rank, ids(cohort.participants)])).toEqual([
      [1, [1, 2]],
      [3, [3]],
      [4, [4]],
      [5, [5]],
    ]);
    expect(model.me).toMatchObject({ rank: 1, rankConfirmed: true, rankTied: true });
    expect(model.groups).toBeNull();
  });

  it("places me into the cohort of my final rank even when opponents share it", () => {
    const runtime = resultsRuntime({
      ...FINAL,
      rank: 3,
      opponents: [
        resultsOpponent(2, "FINISHED", 1),
        resultsOpponent(3, "FINISHED", 1),
        resultsOpponent(4, "FINISHED", 3),
        resultsOpponent(5, "FINISHED", 5),
      ],
    });

    expect(buildStudentRaceResultsViewModel(runtime, null).finalCohorts.map((cohort) => [cohort.rank, ids(cohort.participants)])).toEqual([
      [1, [2, 3]],
      [3, [1, 4]],
      [5, [5]],
    ]);
  });

  it("keeps a student who did not finish in the final standings without claiming a finish", () => {
    const runtime = resultsRuntime({
      ...FINAL,
      playerStatus: "DISCONNECTED",
      playerFinished: false,
      playerFinishedAtEpochMs: null,
      position: 640,
      rank: 5,
      opponents: [
        resultsOpponent(2, "FINISHED", 1),
        resultsOpponent(3, "FINISHED", 2),
        resultsOpponent(4, "FINISHED", 3),
        resultsOpponent(5, "DISCONNECTED", 4),
      ],
    });
    const model = buildStudentRaceResultsViewModel(runtime, null);

    expect(model.me).toMatchObject({ finished: false, rank: 5, rankConfirmed: true });
    expect(model.counts).toEqual({ finished: 3, racing: 0, out: 2 });
    expect(model.finalCohorts.at(-1).participants).toEqual([expect.objectContaining({ isMe: true, status: "DISCONNECTED" })]);
  });
});
