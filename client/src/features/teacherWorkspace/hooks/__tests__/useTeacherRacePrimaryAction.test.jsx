import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import useTeacherRacePrimaryAction from "../useTeacherRacePrimaryAction";
import { showInfoNotification } from "../../../../shared/notifications/appNotifications";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../../../shared/notifications/appNotifications", () => ({
  showInfoNotification: vi.fn(),
}));

function execute(race) {
  const { result } = renderHook(() => useTeacherRacePrimaryAction());
  result.current(race);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTeacherRacePrimaryAction", () => {
  it("announces the upcoming summary for a finished race without navigating", () => {
    execute({ raceId: 7, status: "FINISHED" });

    expect(showInfoNotification).toHaveBeenCalledExactlyOnceWith({
      message: i18n.t(`${I18N_NAMESPACES.TEACHER_WORKSPACE}:racesPage.summarySoon`),
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it.each([
    ["a cancelled race", { raceId: 7, status: "CANCELLED" }],
    ["an unknown status", { raceId: 7, status: "ARCHIVED" }],
    ["a missing race", null],
    ["a waiting race without an id", { status: "WAITING_FOR_PLAYERS" }],
  ])("does nothing for %s", (_label, race) => {
    expect(() => execute(race)).not.toThrow();

    expect(navigateMock).not.toHaveBeenCalled();
    expect(showInfoNotification).not.toHaveBeenCalled();
  });
});
