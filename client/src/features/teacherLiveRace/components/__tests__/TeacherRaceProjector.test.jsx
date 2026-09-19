import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import TeacherRaceProjector from "../TeacherRaceProjector";
import { buildTeacherRaceProjectorViewModel } from "../../utils/buildTeacherRaceProjectorViewModel";
import { mapTeacherRaceLiveState } from "../../runtime/mapTeacherRaceLiveState";
import {
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../runtime/teacherRaceLiveTestFixtures";
import { TEACHER_CONNECTION_STATES } from "../../runtime/teacherRaceLiveConstants";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";

function text(key, values) {
  return i18n.t(`${I18N_NAMESPACES.TEACHER_LIVE_RACE}:${key}`, values);
}

function rosterRuntime(overrides = {}) {
  return mapTeacherRaceLiveState(
    teacherLiveStateResponse({
      players: [
        teacherLivePlayer({ racePlayerId: 1, displayName: "Noa", laneNumber: 3, rank: 1, position: 1000, status: "FINISHED" }),
        teacherLivePlayer({ racePlayerId: 2, displayName: "Dan", laneNumber: 1, rank: 1, position: 1000, status: "FINISHED" }),
        teacherLivePlayer({ racePlayerId: 3, displayName: "Maya", laneNumber: 2, rank: 3, position: 250, status: "DISCONNECTED" }),
      ],
      ...overrides,
    }),
  );
}

function renderProjector({ runtime = rosterRuntime(), elapsedMs = 61_000, ...props } = {}) {
  const viewModel = buildTeacherRaceProjectorViewModel(runtime, elapsedMs);
  const onToggleFullscreen = vi.fn();
  const onBackToRaces = vi.fn();

  render(
    <MantineProvider>
      <TeacherRaceProjector
        viewModel={viewModel}
        recentEvents={[]}
        connectionState={TEACHER_CONNECTION_STATES.LIVE}
        serverNowEpochMs={1_755_600_100_000}
        fullscreen={false}
        fullscreenSupported
        onToggleFullscreen={onToggleFullscreen}
        onBackToRaces={onBackToRaces}
        {...props}
      />
    </MantineProvider>,
  );

  return { viewModel, onToggleFullscreen, onBackToRaces };
}

describe("TeacherRaceProjector", () => {
  it("keeps the track physically left-to-right in both languages and orders lanes by lane number", async () => {
    for (const language of ["he", "en"]) {
      await i18n.changeLanguage(language);
      const { unmount } = render(
        <MantineProvider>
          <TeacherRaceProjector
            viewModel={buildTeacherRaceProjectorViewModel(rosterRuntime(), null)}
            recentEvents={[]}
            connectionState={TEACHER_CONNECTION_STATES.LIVE}
            serverNowEpochMs={null}
            fullscreen={false}
            fullscreenSupported={false}
            onToggleFullscreen={() => {}}
            onBackToRaces={() => {}}
          />
        </MantineProvider>,
      );

      const track = screen.getByTestId("teacher-race-track");
      expect(track).toHaveAttribute("dir", "ltr");
      const lanes = [...track.querySelectorAll("[data-lane-number]")];
      expect(lanes.map((lane) => lane.getAttribute("data-lane-number"))).toEqual(["1", "2", "3"]);
      expect(lanes.map((lane) => lane.getAttribute("data-progress-percent"))).toEqual(["100", "25", "100"]);
      unmount();
    }
    await i18n.changeLanguage("he");
  });

  it("renders the leaderboard in server order with tie ranks and the disconnected treatment", () => {
    renderProjector();

    const list = screen.getByRole("list", { name: undefined });
    const rows = within(screen.getByLabelText(text("leaderboard.title"))).getAllByRole("listitem");
    expect(rows.map((row) => row.getAttribute("data-race-player-id"))).toEqual(["1", "2", "3"]);
    expect(rows.map((row) => within(row).getByText(/^[0-9]+$/).textContent)).toEqual(["1", "1", "3"]);
    expect(within(rows[2]).getByRole("img", { name: text("playerStatus.disconnected") })).toBeInTheDocument();
    expect(list).toBeInTheDocument();
  });

  it("shows the header stats, the live badge and delegates fullscreen and back actions", () => {
    const { onToggleFullscreen, onBackToRaces } = renderProjector();

    expect(screen.getByRole("heading", { level: 1, name: "Jungle Cup" })).toBeInTheDocument();
    expect(screen.getByText(text("header.live"))).toBeInTheDocument();
    expect(screen.getByText("01:01")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(
      within(screen.getByText(text("stats.participants")).parentElement).getByText("3"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: text("header.fullscreenEnter") }));
    fireEvent.click(screen.getByRole("button", { name: text("footer.backToRaces") }));

    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
    expect(onBackToRaces).toHaveBeenCalledTimes(1);
    expect(screen.getByText(text("connection.live"))).toBeInTheDocument();
  });

  it("hides the fullscreen action when unsupported and renders the finished overlay for a finished race", () => {
    renderProjector({
      runtime: rosterRuntime({ status: "FINISHED" }),
      fullscreenSupported: false,
      connectionState: TEACHER_CONNECTION_STATES.ENDED,
    });

    expect(screen.queryByRole("button", { name: text("header.fullscreenEnter") })).not.toBeInTheDocument();
    expect(screen.getByText(text("finished.title"))).toBeInTheDocument();
    expect(screen.getByText(text("header.finished"))).toBeInTheDocument();
    expect(screen.getByText(text("connection.ended"))).toBeInTheDocument();
  });

  it("renders the progress markers from config and the feed with relative times", () => {
    renderProjector({
      recentEvents: [
        {
          id: "13:CORRECT_ANSWER:1",
          kind: "CORRECT_ANSWER",
          messageKey: "feed.correctAnswer",
          values: { name: "Noa" },
          racePlayerId: 1,
          occurredAtEpochMs: 1_755_600_092_000,
        },
        {
          id: "12:RACE_FINISHED:race",
          kind: "RACE_FINISHED",
          messageKey: "feed.raceFinished",
          values: {},
          racePlayerId: null,
          occurredAtEpochMs: 1_755_600_100_500,
        },
      ],
    });

    const markers = [...document.querySelectorAll("[data-marker]")].map((marker) => marker.getAttribute("data-marker"));
    expect(markers).toEqual(TEACHER_RACE_PROJECTOR_CONFIG.progressMarkers.map((marker) => String(marker.value)));

    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    const items = within(log).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText(text("feed.correctAnswer", { name: "Noa" }))).toBeInTheDocument();
    expect(within(items[0]).getByText(new Intl.RelativeTimeFormat("he", { numeric: "auto" }).format(-8, "second"))).toBeInTheDocument();
    expect(within(items[1]).getByText(new Intl.RelativeTimeFormat("he", { numeric: "auto" }).format(0, "second"))).toBeInTheDocument();
  });
});
