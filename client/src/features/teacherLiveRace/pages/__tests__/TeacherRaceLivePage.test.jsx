import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
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
  createTeacherRaceEventSource: vi.fn(() => ({ readyState: 0, close: vi.fn() })),
}));

const ROOM_MARKER = "room-page-marker";
const RACES_MARKER = "races-page-marker";

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
          <Route
            path={ROUTES.TEACHER_RACES}
            element={<div data-testid={RACES_MARKER} />}
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

    expect(screen.getByRole("heading", { level: 1, name: "Jungle Cup" })).toBeInTheDocument();
    expect(screen.getByText(text("header.live"))).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getAllByText("Noa")).toHaveLength(2);
    expect(screen.getAllByText("Dan")).toHaveLength(2);
    expect(screen.getByTestId("teacher-race-track")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText(text("connection.connecting"))).toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.queryByTestId(ROOM_MARKER)).not.toBeInTheDocument();
  });

  it("renders the finished projector with its overlay for a finished race", async () => {
    getTeacherRaceLiveState.mockResolvedValue(
      teacherLiveStateResponse({ status: "FINISHED" }),
    );

    renderLivePage();
    await act(async () => {});

    expect(screen.getByText(text("header.finished"))).toBeInTheDocument();
    expect(screen.getByText(text("finished.title"))).toBeInTheDocument();
    expect(screen.getByText(text("connection.ended"))).toBeInTheDocument();
    expect(screen.getAllByText("Noa")).toHaveLength(2);
  });

  it("wires the fullscreen action to the projector surface and follows the browser state", async () => {
    let fullscreenElement = null;
    const changeFullscreen = (element, target) => {
      fullscreenElement = element;
      target.dispatchEvent(new Event("fullscreenchange"));
    };
    const requestFullscreen = vi.fn(function requestFullscreen() {
      changeFullscreen(this, this);
      return Promise.resolve();
    });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreenElement });
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    onTestFinished(() => {
      delete document.fullscreenEnabled;
      delete document.fullscreenElement;
      delete HTMLElement.prototype.requestFullscreen;
    });
    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse());

    renderLivePage();
    await act(async () => {});

    const surface = screen.getByRole("region", { name: "Jungle Cup" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: text("header.fullscreenEnter") }));
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen.mock.contexts[0]).toBe(surface);
    expect(
      screen.getByRole("button", { name: text("header.fullscreenExit") }),
    ).toHaveAttribute("aria-pressed", "true");

    act(() => changeFullscreen(null, surface));

    expect(
      screen.getByRole("button", { name: text("header.fullscreenEnter") }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("navigates back to the races list from the projector footer", async () => {
    getTeacherRaceLiveState.mockResolvedValue(teacherLiveStateResponse());

    renderLivePage();
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: text("footer.backToRaces") }));

    expect(screen.getByTestId(RACES_MARKER)).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { level: 1, name: "Jungle Cup" })).toBeInTheDocument();
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
