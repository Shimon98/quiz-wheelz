import { describe, expect, it } from "vitest";

import { STUDENT_RESULTS_PHASES } from "../../config/studentRaceResultsConfig";
import { resultsRuntime } from "../../runtime/studentRaceResultsTestFixtures";
import { resolveStudentResultsPhase } from "../studentRaceResultsStatus";

describe("resolveStudentResultsPhase", () => {
  it("watches results once I finished while the race still runs", () => {
    expect(resolveStudentResultsPhase(resultsRuntime())).toBe(STUDENT_RESULTS_PHASES.WATCHING);
  });

  it("is final as soon as the whole race is finished", () => {
    expect(resolveStudentResultsPhase(resultsRuntime({ raceStatus: "FINISHED", raceFinished: true }))).toBe(
      STUDENT_RESULTS_PHASES.FINAL,
    );
  });

  it("is final for a student who did not finish once the race is over", () => {
    const runtime = resultsRuntime({
      raceStatus: "FINISHED",
      raceFinished: true,
      playerStatus: "DISCONNECTED",
      playerFinished: false,
      playerFinishedAtEpochMs: null,
      position: 640,
    });

    expect(resolveStudentResultsPhase(runtime)).toBe(STUDENT_RESULTS_PHASES.FINAL);
  });

  it.each([
    ["while I am still racing", { playerStatus: "RACING", playerFinished: false, playerFinishedAtEpochMs: null, position: 500 }],
    ["while I left before finishing", { playerStatus: "DISCONNECTED", playerFinished: false, playerFinishedAtEpochMs: null, position: 500 }],
    ["for a cancelled race", { raceStatus: "CANCELLED" }],
  ])("has no results phase %s", (_label, overrides) => {
    expect(resolveStudentResultsPhase(resultsRuntime(overrides))).toBeNull();
  });

  it("has no results phase before any runtime exists", () => {
    expect(resolveStudentResultsPhase(null)).toBeNull();
  });
});
