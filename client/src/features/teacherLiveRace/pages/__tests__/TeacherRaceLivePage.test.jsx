import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { ROUTES } from "../../../../constants/routeConstants";
import TeacherRaceLivePage from "../TeacherRaceLivePage";
import { getTeacherRaceLiveState } from "../../../../api/teacherRaceLiveApi";
import { teacherLiveStateResponse } from "../../runtime/teacherRaceLiveTestFixtures";

vi.mock("../../../../api/teacherRaceLiveApi", () => ({
  getTeacherRaceLiveState: vi.fn(),
}));

const ROOM_MARKER = "room-page-marker";

function text(key) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_LIVE_RACE}:${key}`);
}

function renderLivePage(raceId = 7) {
  return render(
    <MantineProvider>
      <MemoryRouter initialEntries={[`/teacher/races/${raceId}/live`]}>
        <Routes>
          <Route path={ROUTES.TEACHER_RACE_LIVE} element={<TeacherRaceLivePage />} />
          <Route
            path={ROUTES.TEACHER_RACE_ROOM}
            element={<div data-testid={ROOM_MARKER} />}
          />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherRaceLivePage", () => {
  it("shows the loading state until the live state arrives", () => {
    getTeacherRaceLiveState.mockReturnValue(new Promise(() => {}));

    renderLivePage();

    expect(screen.getByText(text("states.loading"))).toBeInTheDocument();
  });

  it("redirects a waiting race to its room", async () => {
    getTeacherRaceLiveState.mockResolvedValue(
      teacherLiveStateResponse({ status: "WAITING_FOR_PLAYERS", players: [] }),
    );

    renderLivePage();
    await act(async () => {});

    expect(screen.getByTestId(ROOM_MARKER)).toBeInTheDocument();
  });

  it("renders the authoritative foundation for a race in progress", async () => {
    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse());

    renderLivePage();
    await act(async () => {});

    expect(screen.getByRole("heading", { name: "Jungle Cup" })).toBeInTheDocument();
    expect(screen.getByText(text("foundation.live"))).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("Noa")).toBeInTheDocument();
    expect(screen.getByText("Dan")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByTestId(ROOM_MARKER)).not.toBeInTheDocument();
  });

  it("renders the finished label for a finished race", async () => {
    getTeacherRaceLiveState.mockResolvedValue(
      teacherLiveStateResponse({ status: "FINISHED" }),
    );

    renderLivePage();
    await act(async () => {});

    expect(screen.getByText(text("foundation.finished"))).toBeInTheDocument();
    expect(screen.getByText("Noa")).toBeInTheDocument();
  });

  it("shows the not-found state for a missing or foreign race", async () => {
    getTeacherRaceLiveState.mockRejectedValue({
      response: { status: 404, data: { error: "RACE_NOT_FOUND", code: 3004 } },
    });

    renderLivePage(99);
    await act(async () => {});

    expect(screen.getByText(text("states.notFoundTitle"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: text("states.backToRaces") }),
    ).toBeInTheDocument();
  });

  it("shows the cancelled state without a projector", async () => {
    getTeacherRaceLiveState.mockResolvedValue(
      teacherLiveStateResponse({ status: "CANCELLED" }),
    );

    renderLivePage();
    await act(async () => {});

    expect(screen.getByText(text("states.cancelledTitle"))).toBeInTheDocument();
    expect(screen.queryByText("Noa")).not.toBeInTheDocument();
  });

  it("shows a retryable error and reloads on retry", async () => {
    getTeacherRaceLiveState
      .mockRejectedValueOnce({ response: { status: 500, data: { error: "INTERNAL_ERROR", code: 1 } } })
      .mockResolvedValueOnce(teacherLiveStateResponse());

    renderLivePage();
    await act(async () => {});

    expect(screen.getByText(text("states.errorTitle"))).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: text("states.retry") }));
    });

    expect(getTeacherRaceLiveState).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("heading", { name: "Jungle Cup" })).toBeInTheDocument();
  });

  it("shows the contract state when the server payload is malformed", async () => {
    getTeacherRaceLiveState.mockResolvedValue(
      teacherLiveStateResponse({ players: [{ racePlayerId: "bad" }] }),
    );

    renderLivePage();
    await act(async () => {});

    expect(screen.getByText(text("states.contractTitle"))).toBeInTheDocument();
  });
});
