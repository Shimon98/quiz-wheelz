import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import useTeacherRacePrimaryAction from "../useTeacherRacePrimaryAction";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

function execute(race) {
  const { result } = renderHook(() => useTeacherRacePrimaryAction());
  result.current(race);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTeacherRacePrimaryAction", () => {
  it.each([
    ["a waiting race", { raceId: 7, status: "WAITING_FOR_PLAYERS" }, "/teacher/races/7/room"],
    ["a ready race", { raceId: 7, status: "READY" }, "/teacher/races/7/room"],
    ["a live race", { raceId: 7, status: "IN_PROGRESS" }, "/teacher/races/7/live"],
    ["a finished race", { raceId: 7, status: "FINISHED" }, "/teacher/races/7/results"],
    ["a finished dashboard race keyed by id", { id: 9, status: "FINISHED" }, "/teacher/races/9/results"],
  ])("opens the right screen for %s", (_label, race, path) => {
    execute(race);

    expect(navigateMock).toHaveBeenCalledExactlyOnceWith(path);
  });

  it.each([
    ["a cancelled race", { raceId: 7, status: "CANCELLED" }],
    ["an unknown status", { raceId: 7, status: "ARCHIVED" }],
    ["a missing race", null],
    ["a finished race without an id", { status: "FINISHED" }],
  ])("does nothing for %s", (_label, race) => {
    expect(() => execute(race)).not.toThrow();

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
