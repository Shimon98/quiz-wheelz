import { describe, expect, it } from "vitest";

import { mapTeacherRaceResults } from "../../runtime/mapTeacherRaceResults";
import { teacherRaceResultsResponse, teacherResultPlayer } from "../../runtime/teacherRaceResultsTestFixtures";
import { buildTeacherRaceResultsViewModel } from "../buildTeacherRaceResultsViewModel";

function viewModel(overrides = {}, language = "he") {
  return buildTeacherRaceResultsViewModel(
    mapTeacherRaceResults(teacherRaceResultsResponse(overrides)),
    language,
  );
}

describe("buildTeacherRaceResultsViewModel", () => {
  it("keeps the standings exactly in server order", () => {
    expect(viewModel().standings.map((row) => row.racePlayerId)).toEqual([11, 12, 13, 14]);
  });

  it("makes placement art eligible only for players who finished", () => {
    const players = [
      teacherResultPlayer(),
      teacherResultPlayer({ racePlayerId: 12, displayName: "Dan", laneNumber: 2, rank: 2 }),
      teacherResultPlayer({
        racePlayerId: 14,
        displayName: "Adi",
        laneNumber: 4,
        rank: 3,
        status: "DISCONNECTED",
        finishedAtEpochMs: null,
      }),
    ];

    expect(viewModel({ players }).standings.map((row) => row.placementArtEligible)).toEqual([true, true, false]);
  });

  it("keeps tied server ranks for every finisher without inventing a second place", () => {
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
    const model = viewModel({ players, winnerRacePlayerIds: [11, 12] });

    expect(model.standings.map((row) => [row.rank, row.placementArtEligible])).toEqual([
      [1, true],
      [1, true],
      [3, true],
    ]);
    expect(model.winners.map((row) => row.displayName)).toEqual(["Noa", "Maya"]);
  });

  it("returns no winners when nobody finished", () => {
    expect(viewModel({ winnerRacePlayerIds: [] }).winners).toEqual([]);
  });

  it("formats finish times from the race start and leaves non-finishers without a time", () => {
    const rows = viewModel().standings;

    expect(rows[0].finishTimeLabel).toBe("02:14");
    expect(rows[3].finishTimeLabel).toBeNull();
    expect(rows[3].finished).toBe(false);
  });

  it("uses the race lifecycle for the duration", () => {
    const model = viewModel();

    expect(model.summary.duration).toBe("02:33");
  });

  it("shows no finish times, duration or finish date when the server has no race times", () => {
    const model = viewModel({ startedAtEpochMs: null, finishedAtEpochMs: null });

    expect(model.standings[0]).toMatchObject({ finished: true, finishTimeLabel: null });
    expect(model.summary.duration).toBeNull();
    expect(model.header.finishedAtLabel).toBeNull();
  });

  it("maps the summary without computing anything new", () => {
    expect(viewModel().summary).toMatchObject({
      participants: 4,
      finished: 3,
      didNotFinish: 1,
      correctAnswers: 30,
      wrongAnswers: 11,
    });
  });

  it("resolves award players by id and joins tied names in the active language", () => {
    const awards = [{ type: "MOST_CORRECT_ANSWERS", racePlayerIds: [11, 13], value: 9 }];

    const [english] = viewModel({ awards }, "en").awards;
    const [hebrew] = viewModel({ awards }, "he").awards;

    expect(english.players.map((row) => row.displayName)).toEqual(["Noa", "Maya"]);
    expect(english.namesLabel).toBe("Noa and Maya");
    expect(hebrew.namesLabel).toBe("Noa ו-Maya");
  });

  it("compacts a large award tie for display while keeping every recipient in server order", () => {
    const awards = [{ type: "BEST_STREAK", racePlayerIds: [14, 11, 13, 12], value: 7 }];
    const [award] = viewModel({ awards }, "en").awards;

    expect(award.players.map((row) => row.displayName)).toEqual(["Adi", "Noa", "Maya", "Dan"]);
    expect(award.namesLabel).toBe("Adi, Noa, Maya, and Dan");
    expect(award.visibleNameParts.map((part) => part.value).join("")).toBe("Adi, Noa");
    expect(award.hiddenNameCount).toBe(2);
  });

  it("shows a two-way award tie in full without hiding anyone", () => {
    const awards = [{ type: "MOST_CORRECT_ANSWERS", racePlayerIds: [11, 12], value: 9 }];
    const [award] = viewModel({ awards }, "he").awards;

    expect(award.visibleNameParts.map((part) => part.value).join("")).toBe(award.namesLabel);
    expect(award.hiddenNameCount).toBe(0);
  });

  it("keeps the same player in every award the server gave them", () => {
    const awards = viewModel().awards;

    expect(awards.map((award) => award.type)).toEqual(["HIGHEST_SCORE", "MOST_CORRECT_ANSWERS", "BEST_STREAK"]);
    expect(awards.map((award) => award.players.map((row) => row.displayName))).toEqual([["Noa"], ["Noa"], ["Noa"]]);
  });

  it("shows an award won by a player who did not finish without filtering them out", () => {
    const awards = [{ type: "BEST_STREAK", racePlayerIds: [14], value: 9 }];
    const [award] = viewModel({ awards }).awards;

    expect(award.players.map((row) => [row.displayName, row.finished])).toEqual([["Adi", false]]);
    expect(award.namesLabel).toBe("Adi");
  });

  it("carries the lane color and the side-view art of each vehicle", () => {
    const [first] = viewModel().standings;

    expect(first.accentColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(first.vehicleSrc).toContain("hover-kart-green-side");
  });

  it("carries the front hero art of each vehicle for the winner stage", () => {
    const model = viewModel();

    expect(model.winners.map((row) => row.heroVehicleSrc)).toEqual([
      expect.stringContaining("hover-kart-green-front"),
    ]);
    expect(model.standings[1].heroVehicleSrc).toContain("hover-kart-blue-front");
  });

  it("shows the subject in the active language", () => {
    expect(viewModel({}, "he").header.subjectName).toBe("חשבון");
    expect(viewModel({}, "en").header.subjectName).toBe("Math");
  });
});
