import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import useRacePlayerState from "../../../../shared/racePlayer/useRacePlayerState";
import useWaitingRace from "../useWaitingRace";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("../../../../shared/racePlayer/useRacePlayerState", () => ({ default: vi.fn() }));

function stateFor(raceStatus, playerStatus) {
  return {
    raceState: { snapshot: { raceStatus, playerStatus } },
    isLoading: false,
    error: null,
    retry: vi.fn(),
    silentRefresh: vi.fn(),
    authoritativeResync: vi.fn(),
  };
}

let play;

beforeEach(() => {
  play = vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");
  vi.spyOn(audioEngine, "preload").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  navigateMock.mockReset();
});

describe("useWaitingRace start cue", () => {
  it("plays the start cue once when the race starts while the student waits, then enters the race", () => {
    useRacePlayerState.mockReturnValue(stateFor("WAITING_FOR_PLAYERS", "WAITING"));
    const { rerender } = renderHook(() => useWaitingRace());
    expect(play).not.toHaveBeenCalled();

    useRacePlayerState.mockReturnValue(stateFor("IN_PROGRESS", "RACING"));
    rerender();

    expect(play).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.RACE_START);
    expect(navigateMock).toHaveBeenCalledWith("/student/race", { replace: true });
  });

  it("stays silent for a late join or a reload that finds the race already running", () => {
    useRacePlayerState.mockReturnValue(stateFor("IN_PROGRESS", "RACING"));

    renderHook(() => useWaitingRace());

    expect(play).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/student/race", { replace: true });
  });

  it("does not cheer a race that was cancelled while waiting", () => {
    useRacePlayerState.mockReturnValue(stateFor("WAITING_FOR_PLAYERS", "WAITING"));
    const { rerender } = renderHook(() => useWaitingRace());

    useRacePlayerState.mockReturnValue(stateFor("CANCELLED", "WAITING"));
    rerender();

    expect(play).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/student/race", { replace: true });
  });
});
