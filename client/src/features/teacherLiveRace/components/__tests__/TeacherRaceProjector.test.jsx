import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import TeacherRaceProjector from "../TeacherRaceProjector";
import TeacherLiveEventsPanel from "../events/TeacherLiveEventsPanel";
import { buildTeacherRaceProjectorViewModel } from "../../utils/buildTeacherRaceProjectorViewModel";
import { mapTeacherRaceLiveState } from "../../runtime/mapTeacherRaceLiveState";
import {
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../runtime/teacherRaceLiveTestFixtures";
import { TEACHER_CONNECTION_STATES } from "../../runtime/teacherRaceLiveConstants";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

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

    const disconnectedLane = screen.getByTestId("teacher-race-track").querySelector('[data-lane-number="2"]');
    expect(disconnectedLane).not.toHaveClass(...S.muted.split(" "));
    expect(disconnectedLane.firstElementChild).toHaveClass(...S.muted.split(" "));
    expect(disconnectedLane.querySelector("[data-vehicle-asset-key]").parentElement).toHaveClass(
      ...S.laneVehicleMuted.split(" "),
    );
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

  it("shows the brand once and only in fullscreen, where the workspace navbar is hidden", () => {
    const brandLockups = () => document.querySelectorAll('[dir="ltr"][aria-label="QuizWheelz"]');

    const windowed = renderProjector({ fullscreen: false });
    expect(windowed.viewModel).toBeDefined();
    expect(brandLockups()).toHaveLength(0);
    cleanup();

    renderProjector({ fullscreen: true });
    expect(brandLockups()).toHaveLength(1);
    expect(screen.getByRole("contentinfo").querySelector('[aria-label="QuizWheelz"]')).toBeNull();
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

  it("paints each lane and leaderboard row with the player's accent and mirrors the progress target on the lane fill", () => {
    renderProjector();

    const lane = screen.getByTestId("teacher-race-track").querySelector('[data-lane-number="2"]');
    expect(lane.getAttribute("style")).toContain("--qw-lane-accent");
    expect(lane.querySelectorAll("[data-guide]")).toHaveLength(TEACHER_RACE_PROJECTOR_CONFIG.progressMarkers.length);
    expect(lane.querySelector("[data-progress-fill]").style.width).toBe("25%");

    const rows = within(screen.getByLabelText(text("leaderboard.title"))).getAllByRole("listitem");
    expect(rows[2].getAttribute("style")).toContain("--qw-lane-accent");
    expect(rows[2].querySelector("[data-progress-fill]").style.width).toBe("25%");
  });
  it("renders the jungle world art once, keeps START/FINISH as single translated labels over the props and hides all art from assistive tech", () => {
    renderProjector();

    const backdrops = document.querySelectorAll("[data-projector-backdrop]");
    expect(backdrops).toHaveLength(1);
    expect(backdrops[0]).toHaveAttribute("alt", "");
    expect(backdrops[0].closest("[aria-hidden='true']")).not.toBeNull();

    const track = screen.getByTestId("teacher-race-track");
    expect(track.querySelectorAll("[data-track-sign]")).toHaveLength(2);
    expect(within(track).getAllByText(text("track.start"))).toHaveLength(1);
    expect(within(track).getAllByText(text("track.finish"))).toHaveLength(1);
    for (const art of track.querySelectorAll("[data-track-sign] img")) {
      expect(art).toHaveAttribute("alt", "");
      expect(art).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getAllByRole("img").every((img) => img.tagName !== "IMG")).toBe(true);
  });

  it("keeps the race title and panel headings as real text over decorative accent art", () => {
    renderProjector({ fullscreen: true });

    const title = screen.getByRole("heading", { level: 1, name: "Jungle Cup" });
    expect(title.querySelector("[data-title-badge-art]")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { level: 2, name: text("leaderboard.title") })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: text("feed.title") })).toBeInTheDocument();

    for (const image of document.querySelectorAll("section img")) {
      expect(image).toHaveAttribute("alt", "");
    }
    expect(screen.queryAllByRole("img").filter((node) => node.tagName === "IMG")).toHaveLength(0);
  });

  it("shows the connected Wi-Fi art only while live and keeps the state icon otherwise", () => {
    renderProjector({ connectionState: TEACHER_CONNECTION_STATES.LIVE });
    const live = screen.getByText(text("connection.live")).parentElement;
    expect(live.querySelector("[data-connection-art]")).not.toBeNull();
    cleanup();

    renderProjector({ connectionState: TEACHER_CONNECTION_STATES.RECOVERING });
    const recovering = screen.getByText(text("connection.recovering")).parentElement;
    expect(recovering.querySelector("[data-connection-art]")).toBeNull();
    expect(recovering.querySelector("svg")).not.toBeNull();
  });
  it("pulses the live events accent only for an event that arrives after mount", () => {
    const older = { id: "12:RANK_UP:2", kind: "RANK_UP", messageKey: "feed.rankUp", values: { name: "Dan", rank: 1 }, racePlayerId: 2, occurredAtEpochMs: 1_755_600_090_000 };
    const fresh = { id: "13:CORRECT_ANSWER:1", kind: "CORRECT_ANSWER", messageKey: "feed.correctAnswer", values: { name: "Noa" }, racePlayerId: 1, occurredAtEpochMs: 1_755_600_099_000 };
    const panel = (items) => (
      <MantineProvider>
        <TeacherLiveEventsPanel items={items} serverNowEpochMs={1_755_600_100_000} />
      </MantineProvider>
    );
    const { rerender } = render(panel([older]));
    expect(document.querySelector("[data-fresh-feed-item]")).toBeNull();

    rerender(panel([fresh, older]));
    expect(document.querySelector("[data-fresh-feed-item]")).toHaveAttribute("data-fresh-feed-item", fresh.id);
  });
});
