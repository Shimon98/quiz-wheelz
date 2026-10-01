import { describe, expect, it } from "vitest";

import { resolveTeacherResultsView, TEACHER_RESULTS_VIEWS } from "../resolveTeacherResultsView";

describe("resolveTeacherResultsView", () => {
  it.each([
    [{ category: "API_CONTRACT" }, TEACHER_RESULTS_VIEWS.CONTRACT_ERROR],
    [{ category: "NOT_FOUND", errorName: "RACE_NOT_FOUND" }, TEACHER_RESULTS_VIEWS.NOT_FOUND],
    [{ category: "CONFLICT", errorName: "RACE_RESULTS_NOT_AVAILABLE" }, TEACHER_RESULTS_VIEWS.NOT_AVAILABLE],
    [{ category: "CONFLICT", errorName: "SOMETHING_ELSE" }, TEACHER_RESULTS_VIEWS.ERROR],
    [{ category: "NETWORK" }, TEACHER_RESULTS_VIEWS.ERROR],
    [{ category: "SERVER" }, TEACHER_RESULTS_VIEWS.ERROR],
  ])("maps %o to %s", (error, view) => {
    expect(resolveTeacherResultsView({ isLoading: false, error, results: null })).toBe(view);
  });

  it("waits while loading or before results exist", () => {
    expect(resolveTeacherResultsView({ isLoading: true, error: null, results: null })).toBe(
      TEACHER_RESULTS_VIEWS.LOADING,
    );
    expect(resolveTeacherResultsView({ isLoading: false, error: null, results: null })).toBe(
      TEACHER_RESULTS_VIEWS.LOADING,
    );
  });

  it("is ready once results exist", () => {
    expect(resolveTeacherResultsView({ isLoading: false, error: null, results: {} })).toBe(
      TEACHER_RESULTS_VIEWS.READY,
    );
  });
});
