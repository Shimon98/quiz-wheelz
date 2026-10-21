import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { joinRace } from "../../../../api/racePlayerApi";
import { ROUTES } from "../../../../constants/routeConstants";
import { showApiErrorNotification } from "../../../../shared/notifications/appNotifications";
import { STUDENT_JOIN_STORAGE_KEY } from "../../config/studentJoinConfig";
import useJoinRace from "../useJoinRace";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));
vi.mock("../../../../api/racePlayerApi", () => ({ joinRace: vi.fn() }));
vi.mock("../../../../shared/notifications/appNotifications", () => ({ showApiErrorNotification: vi.fn() }));

const JOIN_RESPONSE = {
  racePlayerId: 91,
  raceId: 7,
  raceTitle: "Jungle Cup",
  roomCode: "ABC123",
  currentPlayers: 3,
  maxPlayers: 8,
  token: "fake-test-token",
  player: { racePlayerId: 91, displayName: "נועה", laneNumber: 3, vehicleAssetKey: "TOY_CAR_GREEN" },
};

async function submit() {
  const { result } = renderHook(() => useJoinRace());
  await act(() => result.current.submitJoin({ roomCode: "ABC123", displayName: "נועה" }));
}

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("useJoinRace", () => {
  it("keeps only the waiting room's display fields and enters the waiting room", async () => {
    joinRace.mockResolvedValue(JOIN_RESPONSE);

    await submit();

    expect(JSON.parse(sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY))).toStrictEqual({
      player: { displayName: "נועה", laneNumber: 3 },
      raceTitle: "Jungle Cup",
      roomCode: "ABC123",
      currentPlayers: 3,
      maxPlayers: 8,
    });
    expect(navigateMock).toHaveBeenCalledExactlyOnceWith(ROUTES.STUDENT_WAITING);
  });

  it("replaces the value an earlier race left when the student joins again", async () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify({ ...JOIN_RESPONSE, raceTitle: "Old Cup", roomCode: "OLD999" }));
    joinRace.mockResolvedValue(JOIN_RESPONSE);

    await submit();

    expect(JSON.parse(sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY))).toStrictEqual({
      player: { displayName: "נועה", laneNumber: 3 },
      raceTitle: "Jungle Cup",
      roomCode: "ABC123",
      currentPlayers: 3,
      maxPlayers: 8,
    });
  });

  it("still enters the waiting room when the browser blocks storage, without an error", async () => {
    joinRace.mockResolvedValue(JOIN_RESPONSE);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    await submit();

    expect(navigateMock).toHaveBeenCalledExactlyOnceWith(ROUTES.STUDENT_WAITING);
    expect(showApiErrorNotification).not.toHaveBeenCalled();
  });

  it("shows the join error and stays on the form when the server refuses, storing nothing", async () => {
    const refused = new Error("refused");
    joinRace.mockRejectedValue(refused);

    await submit();

    expect(showApiErrorNotification).toHaveBeenCalledExactlyOnceWith(refused, { fallbackKey: "student.joinFailed" });
    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY)).toBeNull();
  });
});
