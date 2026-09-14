import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "../../../../i18n/i18n";
import useTeacherRaceRoom from "../useTeacherRaceRoom";
import { getTeacherRaceRoom, startTeacherRace } from "../../../../api/teacherApi";
import {
  showApiErrorNotification,
  showSuccessNotification,
} from "../../../../shared/notifications/appNotifications";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../../../api/teacherApi", () => ({
  getTeacherRaceRoom: vi.fn(),
  startTeacherRace: vi.fn(),
}));

vi.mock("../../../../shared/notifications/appNotifications", () => ({
  showApiErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));

function waitingRoom() {
  return {
    raceId: 7,
    title: "Jungle Cup",
    roomCode: "ABC123",
    status: "WAITING_FOR_PLAYERS",
    maxPlayers: 4,
    currentPlayers: 2,
    players: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getTeacherRaceRoom.mockResolvedValue(waitingRoom());
});

describe("useTeacherRaceRoom start", () => {
  it("navigates to the live route after a successful start without refetching the room", async () => {
    startTeacherRace.mockResolvedValue({ raceId: 7, status: "IN_PROGRESS" });

    const { result } = renderHook(() => useTeacherRaceRoom("7"));
    await act(async () => {});
    expect(getTeacherRaceRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.startRace();
    });

    expect(startTeacherRace).toHaveBeenCalledExactlyOnceWith("7");
    expect(showSuccessNotification).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledExactlyOnceWith("/teacher/races/7/live", {
      replace: true,
    });
    expect(getTeacherRaceRoom).toHaveBeenCalledTimes(1);
    expect(result.current.isStarting).toBe(false);
  });

  it("falls back to the routed raceId when the start response carries none", async () => {
    startTeacherRace.mockResolvedValue({ status: "IN_PROGRESS" });

    const { result } = renderHook(() => useTeacherRaceRoom("7"));
    await act(async () => {});

    await act(async () => {
      await result.current.startRace();
    });

    expect(navigateMock).toHaveBeenCalledWith("/teacher/races/7/live", { replace: true });
  });

  it("stays in the room and notifies when the server refuses the start", async () => {
    startTeacherRace.mockRejectedValue({
      response: { status: 409, data: { error: "RACE_NOT_STARTABLE", code: 3008 } },
    });

    const { result } = renderHook(() => useTeacherRaceRoom("7"));
    await act(async () => {});

    await act(async () => {
      await result.current.startRace();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(showSuccessNotification).not.toHaveBeenCalled();
    expect(showApiErrorNotification).toHaveBeenCalledTimes(1);
    expect(result.current.isStarting).toBe(false);
    expect(result.current.room.status).toBe("WAITING_FOR_PLAYERS");
  });
});
