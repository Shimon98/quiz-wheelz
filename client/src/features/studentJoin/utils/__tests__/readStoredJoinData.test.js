import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_JOIN_STORAGE_KEY } from "../../config/studentJoinConfig";
import { readStoredJoinData, storeJoinData } from "../readStoredJoinData";

const DISPLAY = {
  player: { displayName: "נועה", laneNumber: 3 },
  raceTitle: "Jungle Cup",
  roomCode: "ABC123",
  currentPlayers: 3,
  maxPlayers: 8,
};
// A join response with fields the waiting room never shows, as a server may send now or later.
const JOIN_RESPONSE = {
  ...DISPLAY,
  racePlayerId: 91,
  raceId: 7,
  raceStatus: "WAITING_FOR_PLAYERS",
  token: "fake-test-token",
  futureField: { nested: true },
  player: { ...DISPLAY.player, racePlayerId: 91, vehicleAssetKey: "TOY_CAR_GREEN" },
};
const blocked = () => {
  throw new DOMException("blocked", "SecurityError");
};

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("join display cache", () => {
  it("stores only the fields the waiting room shows", () => {
    storeJoinData(JOIN_RESPONSE);

    expect(JSON.parse(sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY))).toStrictEqual(DISPLAY);
  });

  it("reads a full response stored before this change as display fields only", () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify(JOIN_RESPONSE));

    expect(readStoredJoinData()).toEqual(DISPLAY);
    expect(readStoredJoinData()).not.toHaveProperty("token");
    expect(readStoredJoinData().player).not.toHaveProperty("racePlayerId");
  });

  it("rewrites a full response stored before this change to the display fields once", () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify(JOIN_RESPONSE));

    expect(readStoredJoinData()).toEqual(DISPLAY);
    expect(JSON.parse(sessionStorage.getItem(STUDENT_JOIN_STORAGE_KEY))).toStrictEqual(DISPLAY);

    const setItem = vi.spyOn(Storage.prototype, "setItem");
    expect(readStoredJoinData()).toEqual(DISPLAY);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("still shows the display fields when the browser refuses the rewrite", () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify(JOIN_RESPONSE));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);

    expect(readStoredJoinData()).toEqual(DISPLAY);
  });

  it("writes nothing over a broken value", () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, "{broken");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    expect(readStoredJoinData()).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("keeps Hebrew and English names exactly", () => {
    storeJoinData({ player: { displayName: "Noa נועה" } });

    expect(readStoredJoinData().player.displayName).toBe("Noa נועה");
  });

  it("returns null when nothing is stored or the value is not JSON", () => {
    expect(readStoredJoinData()).toBeNull();

    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, "{broken");
    expect(readStoredJoinData()).toBeNull();
  });

  it("keeps the fields that are present and drops values of the wrong type", () => {
    sessionStorage.setItem(STUDENT_JOIN_STORAGE_KEY, JSON.stringify({
      player: { displayName: { x: 1 }, laneNumber: "3" },
      raceTitle: ["a"],
      roomCode: "ABC123",
      currentPlayers: "3",
      maxPlayers: 8,
    }));

    expect(readStoredJoinData()).toEqual({ player: {}, roomCode: "ABC123", maxPlayers: 8 });
  });

  it("never throws when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);

    expect(() => storeJoinData(JOIN_RESPONSE)).not.toThrow();
    expect(readStoredJoinData()).toBeNull();
  });
});
