import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import TeacherRaceRoomPage from "../TeacherRaceRoomPage";
import useTeacherRaceRoom from "../../hooks/useTeacherRaceRoom";
import { preloadTeacherProjectorArt } from "../../../teacherLiveRace/assets/preloadTeacherProjectorArt";
import { teacherRaceSummary } from "./teacherRaceSummaryFixture";

vi.mock("../../hooks/useTeacherRaceRoom", () => ({
  default: vi.fn(),
}));

vi.mock("../../../teacherLiveRace/assets/preloadTeacherProjectorArt", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    preloadTeacherProjectorArt: vi.fn(actual.preloadTeacherProjectorArt),
  };
});

function roomHook(overrides = {}) {
  const hook = {
    room: teacherRaceSummary({ status: "WAITING_FOR_PLAYERS", currentPlayers: 2, players: [] }),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    startRace: vi.fn(),
    isStarting: false,
    ...overrides,
  };
  vi.mocked(useTeacherRaceRoom).mockReturnValue(hook);
  return hook;
}

function renderRoom() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <TeacherRaceRoomPage />
      </MemoryRouter>
    </MantineProvider>,
  );
}

function startLabel() {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_WORKSPACE}:raceRoom.startRace`);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(preloadTeacherProjectorArt).mockClear();
});

describe("TeacherRaceRoomPage projector art preload", () => {
  it("does not preload while the room is still loading", () => {
    roomHook({ room: null, isLoading: true });

    renderRoom();

    expect(preloadTeacherProjectorArt).not.toHaveBeenCalled();
  });

  it("starts the preload once when the waiting room is usable, not on every poll", () => {
    roomHook();
    const { rerender } = renderRoom();

    roomHook({ room: teacherRaceSummary({ status: "WAITING_FOR_PLAYERS", currentPlayers: 3, players: [] }) });
    rerender(
      <MantineProvider>
        <MemoryRouter>
          <TeacherRaceRoomPage />
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(preloadTeacherProjectorArt).toHaveBeenCalledTimes(1);
  });

  it("keeps the room and the Start button working when the browser cannot preload images", () => {
    vi.stubGlobal("Image", class {
      constructor() {
        throw new Error("image creation blocked");
      }
    });
    const hook = roomHook();

    renderRoom();
    fireEvent.click(screen.getByRole("button", { name: startLabel() }));

    expect(hook.startRace).toHaveBeenCalledTimes(1);
  });
});
