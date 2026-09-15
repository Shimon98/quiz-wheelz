import { describe, expect, it } from "vitest";

import {
  resolveTeacherLiveView,
  TEACHER_LIVE_VIEWS,
} from "../resolveTeacherLiveView";
import { ERROR_CATEGORIES } from "../../../../errors/errorCategories";

function runtimeWithStatus(status) {
  return { race: { status }, players: [], eventVersion: 0 };
}

describe("resolveTeacherLiveView", () => {
  it("shows loading while the request is in flight or nothing has arrived", () => {
    expect(
      resolveTeacherLiveView({ isLoading: true, error: null, runtime: null }),
    ).toBe(TEACHER_LIVE_VIEWS.LOADING);
    expect(
      resolveTeacherLiveView({ isLoading: false, error: null, runtime: null }),
    ).toBe(TEACHER_LIVE_VIEWS.LOADING);
  });

  it("classifies errors before anything else", () => {
    const runtime = runtimeWithStatus("IN_PROGRESS");

    expect(
      resolveTeacherLiveView({
        isLoading: false,
        error: { category: ERROR_CATEGORIES.NETWORK },
        runtime,
      }),
    ).toBe(TEACHER_LIVE_VIEWS.ERROR);
    expect(
      resolveTeacherLiveView({
        isLoading: false,
        error: { category: ERROR_CATEGORIES.API_CONTRACT },
        runtime,
      }),
    ).toBe(TEACHER_LIVE_VIEWS.CONTRACT_ERROR);
    expect(
      resolveTeacherLiveView({
        isLoading: true,
        error: { category: ERROR_CATEGORIES.NOT_FOUND, errorName: "RACE_NOT_FOUND" },
        runtime: null,
      }),
    ).toBe(TEACHER_LIVE_VIEWS.NOT_FOUND);
  });

  it.each([
    ["WAITING_FOR_PLAYERS", TEACHER_LIVE_VIEWS.REDIRECT_ROOM],
    ["READY", TEACHER_LIVE_VIEWS.REDIRECT_ROOM],
    ["IN_PROGRESS", TEACHER_LIVE_VIEWS.PROJECTOR],
    ["FINISHED", TEACHER_LIVE_VIEWS.PROJECTOR],
    ["CANCELLED", TEACHER_LIVE_VIEWS.CANCELLED],
    ["SOMETHING_NEW", TEACHER_LIVE_VIEWS.CONTRACT_ERROR],
  ])("maps race status %s to %s", (status, expectedView) => {
    expect(
      resolveTeacherLiveView({
        isLoading: false,
        error: null,
        runtime: runtimeWithStatus(status),
      }),
    ).toBe(expectedView);
  });
});
