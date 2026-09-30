import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import { mapTeacherRaceResults } from "../../runtime/mapTeacherRaceResults";
import { teacherRaceResultsResponse, teacherResultPlayer } from "../../runtime/teacherRaceResultsTestFixtures";
import { buildTeacherRaceResultsViewModel } from "../../utils/buildTeacherRaceResultsViewModel";
import TeacherResultsWinners from "../TeacherResultsWinners";

const TIED_FIELD = Object.freeze({
  players: [
    teacherResultPlayer(),
    teacherResultPlayer({
      racePlayerId: 12,
      displayName: "Maya",
      laneNumber: 2,
      vehicleColorKey: "BLUE",
      vehicleAssetKey: "TOY_CAR_BLUE",
    }),
  ],
  winnerRacePlayerIds: [11, 12],
  awards: [],
});

function renderWinners(overrides = {}) {
  const { winners } = buildTeacherRaceResultsViewModel(
    mapTeacherRaceResults(teacherRaceResultsResponse(overrides)),
    "en",
  );

  render(
    <MantineProvider>
      <TeacherResultsWinners winners={winners} />
    </MantineProvider>,
  );

  return screen.queryByRole("list");
}

function stageKartOf(card) {
  return card.querySelectorAll("[data-results-stage] img")[1].getAttribute("src");
}

describe("TeacherResultsWinners", () => {
  it("stands the single winner on the podium in the winner's own color under the gold medal", () => {
    const list = renderWinners();
    const [card] = within(list).getAllByRole("listitem");

    expect(list).toHaveAttribute("data-winner-layout", "solo");
    expect(stageKartOf(card)).toContain("hover-kart-green-front");
    expect(card.querySelector("[data-placement]")).toHaveAttribute("data-placement", "gold");
    expect(card.querySelector("[data-placement] img")).toHaveAttribute("alt", "");
    expect(within(card).getByText("Noa")).toBeInTheDocument();
    expect(within(card).getByText("1")).toBeInTheDocument();
  });

  it("isolates the winner name so a long Latin name shortens from its own end", () => {
    const list = renderWinners({
      players: [teacherResultPlayer({ displayName: "Maximilian Alexander Winters" })],
      awards: [],
    });
    const name = within(list).getByText("Maximilian Alexander Winters");

    expect(name.tagName).toBe("BDI");
    expect(name).toHaveAttribute("title", "Maximilian Alexander Winters");
    expect(name).toHaveClass("truncate");
  });

  it("gives every tied winner an equal compact card with the winner's own kart", () => {
    const list = renderWinners(TIED_FIELD);
    const cards = within(list).getAllByRole("listitem");

    expect(list).toHaveAttribute("data-winner-layout", "tied");
    expect(cards.map(stageKartOf)).toEqual([
      expect.stringContaining("hover-kart-green-front"),
      expect.stringContaining("hover-kart-blue-front"),
    ]);
    expect(new Set(cards.map((card) => card.className)).size).toBe(1);
    expect(list.querySelectorAll('[data-placement="gold"]')).toHaveLength(2);
  });

  it("falls back to the side-view kart for a vehicle without front art", () => {
    const list = renderWinners({
      players: [teacherResultPlayer({ vehicleAssetKey: "TOY_CAR_FUTURE" })],
      awards: [],
    });
    const [card] = within(list).getAllByRole("listitem");

    expect(card.querySelector("[data-results-stage]")).toBeNull();
    expect(card.querySelector("img[src*='-front']")).toBeNull();
  });

  it("shows no podium at all when nobody finished", () => {
    const list = renderWinners({ winnerRacePlayerIds: [], awards: [] });

    expect(list).toBeNull();
    expect(document.querySelector("[data-results-stage]")).toBeNull();
  });
});
