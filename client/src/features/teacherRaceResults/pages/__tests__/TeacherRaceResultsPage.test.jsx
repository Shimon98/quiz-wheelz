import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { ROUTES } from "../../../../constants/routeConstants";
import TeacherRaceResultsPage from "../TeacherRaceResultsPage";
import { getTeacherRaceResults } from "../../../../api/teacherRaceResultsApi";
import { teacherRaceResultsResponse, teacherResultPlayer } from "../../runtime/teacherRaceResultsTestFixtures";

vi.mock("../../../../api/teacherRaceResultsApi", () => ({
  getTeacherRaceResults: vi.fn(),
}));

const RACES_MARKER = "races-page-marker";

function text(key, options) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_RACE_RESULTS}:${key}`, options);
}

function liveText(key) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_LIVE_RACE}:${key}`);
}

async function renderResultsPage(raceId = 7) {
  render(
    <MantineProvider>
      <MemoryRouter initialEntries={[`/teacher/races/${raceId}/results`]}>
        <Routes>
          <Route path={ROUTES.TEACHER_RACE_RESULTS} element={<TeacherRaceResultsPage />} />
          <Route path={ROUTES.TEACHER_RACES} element={<div data-testid={RACES_MARKER} />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
  await act(async () => {});
}

function standingNames() {
  return screen.getAllByRole("rowheader").map((cell) => cell.textContent);
}

function standingsTable() {
  return screen.getByRole("table", { name: text("standings.title") });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherRaceResultsPage", () => {
  it("shows the loading state until the results arrive", () => {
    getTeacherRaceResults.mockReturnValue(new Promise(() => {}));

    render(
      <MantineProvider>
        <MemoryRouter initialEntries={["/teacher/races/7/results"]}>
          <Routes>
            <Route path={ROUTES.TEACHER_RACE_RESULTS} element={<TeacherRaceResultsPage />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(screen.getByText(text("states.loading"))).toBeInTheDocument();
  });

  it("renders the standings in server order with the winner and the awards", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    expect(getTeacherRaceResults).toHaveBeenCalledExactlyOnceWith("7");
    expect(standingNames()).toEqual(["Noa", "Dan", "Maya", "Adi"]);
    expect(within(standingsTable()).getByText(text("standings.didNotFinish"))).toBeInTheDocument();
    expect(screen.getByText(text("awards.highestScore"))).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: text("winners.title", { count: 1 }) })).toBeInTheDocument();
  });

  it("names the results region, the title plaque, the final badge and the subject", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    expect(screen.getByRole("region", { name: text("header.regionLabel", { title: "Jungle Cup" }) })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Jungle Cup" })).toBeInTheDocument();
    expect(screen.getByText(text("header.badge"))).toBeInTheDocument();
    expect(screen.getByText("חשבון")).toBeInTheDocument();
  });

  it("gives the standings table a name, a description and scoped headers", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    const table = standingsTable();
    const headers = within(table).getAllByRole("columnheader");

    expect(table).toHaveAccessibleDescription(text("standings.rankingNote"));
    expect(headers).toHaveLength(7);
    expect(headers.every((header) => header.getAttribute("scope") === "col")).toBe(true);
    expect(within(table).getAllByRole("rowheader")[0]).toHaveAttribute("scope", "row");
  });

  it("shows finish times, medals only for finishers and the race summary", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    const rows = within(standingsTable()).getAllByRole("row").slice(1);

    expect(within(rows[0]).getByText("02:14")).toHaveAttribute("dir", "ltr");
    expect(rows.map((row) => row.querySelector("[data-placement]").dataset.placement)).toEqual([
      "gold",
      "silver",
      "bronze",
      "quiet",
    ]);
    expect(screen.getByText(text("summary.didNotFinish"))).toBeInTheDocument();
    expect(screen.getByText("02:33")).toBeInTheDocument();
  });

  it("isolates every standing name for mixed-direction text", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    const names = within(standingsTable())
      .getAllByRole("rowheader")
      .map((cell) => cell.querySelector("bdi"));

    expect(names.map((name) => name.getAttribute("title"))).toEqual(["Noa", "Dan", "Maya", "Adi"]);
    expect(names.every((name) => name.classList.contains("truncate"))).toBe(true);
  });

  it("draws one placement language: medals and wood for finishers, a quiet number for everyone else", async () => {
    const players = [
      teacherResultPlayer(),
      teacherResultPlayer({ racePlayerId: 12, displayName: "Dan", laneNumber: 2, rank: 2 }),
      teacherResultPlayer({ racePlayerId: 13, displayName: "Maya", laneNumber: 3, rank: 3, status: "DISCONNECTED", finishedAtEpochMs: null }),
      teacherResultPlayer({ racePlayerId: 14, displayName: "Adi", laneNumber: 4, rank: 4 }),
      teacherResultPlayer({ racePlayerId: 15, displayName: "Lior", laneNumber: 5, rank: 7, status: "DISCONNECTED", finishedAtEpochMs: null }),
    ];
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse({ players, awards: [] }));
    await renderResultsPage();

    const rows = within(standingsTable()).getAllByRole("row").slice(1);

    expect(standingNames()).toEqual(["Noa", "Dan", "Maya", "Adi", "Lior"]);
    expect(rows.map((row) => row.querySelector("[data-placement]").dataset.placement)).toEqual([
      "gold",
      "silver",
      "quiet",
      "wood",
      "quiet",
    ]);
    expect(within(rows[3]).getByText("4")).not.toHaveClass("sr-only");
  });

  it("shows every tied winner with a gold medal", async () => {
    const players = [
      teacherResultPlayer(),
      teacherResultPlayer({ racePlayerId: 12, displayName: "Maya", laneNumber: 2, rank: 1 }),
    ];
    getTeacherRaceResults.mockResolvedValue(
      teacherRaceResultsResponse({ players, winnerRacePlayerIds: [11, 12], awards: [] }),
    );
    await renderResultsPage();

    const winners = screen.getByRole("heading", { level: 2, name: text("winners.title", { count: 2 }) }).closest("section");

    expect(winners.querySelectorAll('li [data-placement="gold"]')).toHaveLength(2);
  });

  it("says honestly that nobody finished and that there are no awards", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse({ winnerRacePlayerIds: [], awards: [] }));
    await renderResultsPage();

    expect(screen.getByText(text("winners.none"))).toBeInTheDocument();
    expect(screen.getByText(text("awards.none"))).toBeInTheDocument();
  });

  it("marks missing race times as unavailable instead of inventing them", async () => {
    getTeacherRaceResults.mockResolvedValue(
      teacherRaceResultsResponse({ startedAtEpochMs: null, finishedAtEpochMs: null }),
    );
    await renderResultsPage();

    const [firstRow] = within(standingsTable()).getAllByRole("row").slice(1);

    expect(within(firstRow).getByText(text("standings.timeUnavailable"))).toBeInTheDocument();
    expect(screen.getByText(text("summary.unavailable"))).toBeInTheDocument();
  });

  it("wires its own fullscreen action to the results surface", async () => {
    const requestFullscreen = vi.fn(() => Promise.resolve());
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    onTestFinished(() => {
      delete document.fullscreenEnabled;
      delete HTMLElement.prototype.requestFullscreen;
    });
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: liveText("header.fullscreenEnter") }));
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen.mock.contexts[0]).toBe(
      screen.getByRole("region", { name: text("header.regionLabel", { title: "Jungle Cup" }) }),
    );
  });

  it("navigates back to the races list from the footer", async () => {
    getTeacherRaceResults.mockResolvedValue(teacherRaceResultsResponse());
    await renderResultsPage();

    fireEvent.click(screen.getByRole("button", { name: text("footer.backToRaces") }));

    expect(screen.getByTestId(RACES_MARKER)).toBeInTheDocument();
  });

  it("explains a missing race and returns to all races", async () => {
    getTeacherRaceResults.mockRejectedValue({
      response: { status: 404, data: { error: "RACE_NOT_FOUND", code: 3004 } },
    });
    await renderResultsPage(99);

    expect(screen.getByText(text("states.notFoundTitle"))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: text("states.backToRaces") }));
    expect(screen.getByTestId(RACES_MARKER)).toBeInTheDocument();
  });

  it("explains that results are not ready without guessing the race screen and retries on request", async () => {
    getTeacherRaceResults
      .mockRejectedValueOnce({
        response: { status: 409, data: { error: "RACE_RESULTS_NOT_AVAILABLE", code: 3030 } },
      })
      .mockResolvedValueOnce(teacherRaceResultsResponse());
    await renderResultsPage();

    expect(screen.getByText(text("states.notAvailableTitle"))).toBeInTheDocument();
    expect(screen.getByText(text("states.notAvailableBody"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: text("states.backToRaces") })).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: text("states.retry") }));
    });

    expect(getTeacherRaceResults).toHaveBeenCalledTimes(2);
    expect(standingNames()).toEqual(["Noa", "Dan", "Maya", "Adi"]);
  });

  it("returns to all races from the not-ready state", async () => {
    getTeacherRaceResults.mockRejectedValue({
      response: { status: 409, data: { error: "RACE_RESULTS_NOT_AVAILABLE", code: 3030 } },
    });
    await renderResultsPage();

    fireEvent.click(screen.getByRole("button", { name: text("states.backToRaces") }));

    expect(screen.getByTestId(RACES_MARKER)).toBeInTheDocument();
  });

  it("retries after a network failure", async () => {
    getTeacherRaceResults
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(teacherRaceResultsResponse());
    await renderResultsPage();

    expect(screen.getByText(text("states.errorTitle"))).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: text("states.retry") }));
    });

    expect(getTeacherRaceResults).toHaveBeenCalledTimes(2);
    expect(standingNames()).toEqual(["Noa", "Dan", "Maya", "Adi"]);
  });

  it("shows a contract error for malformed results", async () => {
    getTeacherRaceResults.mockResolvedValue({ status: "FINISHED" });
    await renderResultsPage();

    expect(screen.getByText(text("states.contractTitle"))).toBeInTheDocument();
  });

  it("never shows the previous race while the next race loads", async () => {
    getTeacherRaceResults.mockImplementation((raceId) =>
      raceId === "7" ? Promise.resolve(teacherRaceResultsResponse()) : new Promise(() => {}),
    );
    const router = createMemoryRouter(
      [{ path: ROUTES.TEACHER_RACE_RESULTS, element: <TeacherRaceResultsPage /> }],
      { initialEntries: ["/teacher/races/7/results"] },
    );
    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );
    await act(async () => {});

    expect(screen.getByRole("heading", { level: 1, name: "Jungle Cup" })).toBeInTheDocument();

    await act(async () => {
      await router.navigate("/teacher/races/9/results");
    });

    expect(getTeacherRaceResults).toHaveBeenLastCalledWith("9");
    expect(screen.queryByRole("heading", { level: 1, name: "Jungle Cup" })).toBeNull();
    expect(screen.getByText(text("states.loading"))).toBeInTheDocument();
  });
});
