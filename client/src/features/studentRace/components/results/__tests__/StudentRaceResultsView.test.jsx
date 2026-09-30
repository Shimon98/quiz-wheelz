import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../../i18n/i18nConstants";
import StudentRaceResultsView from "../StudentRaceResultsView";
import { buildStudentRaceResultsViewModel } from "../../../utils/buildStudentRaceResultsViewModel";
import {
  resultsFinishOrder,
  resultsOpponent,
  resultsRuntime,
} from "../../../runtime/studentRaceResultsTestFixtures";

const FINAL = Object.freeze({ raceStatus: "FINISHED", raceFinished: true });

function text(key, options) {
  return i18n.t(`${I18N_NAMESPACES.STUDENT_RACE}:${key}`, options);
}

function renderResults(runtimeOverrides = {}, finishOrder = null) {
  const model = buildStudentRaceResultsViewModel(resultsRuntime(runtimeOverrides), finishOrder);

  render(
    <MantineProvider>
      <MemoryRouter>
        <StudentRaceResultsView model={model} />
      </MemoryRouter>
    </MantineProvider>,
  );

  return model;
}

function hero() {
  return screen.getByTestId("student-results-hero");
}

function rowOf(racePlayerId) {
  return document.querySelector(`li[data-race-player-id="${racePlayerId}"]`);
}

function rankTextOf(row) {
  return within(row).queryByText(/^\d+$/)?.textContent ?? null;
}

function placementOf(node) {
  return node.querySelector("[data-placement]")?.dataset.placement ?? null;
}

describe("StudentRaceResultsView personal hero", () => {
  it("says honestly that my place is still being confirmed, without a medal", () => {
    renderResults({ score: 920, highestStreak: 7 });

    expect(within(hero()).getByRole("heading", { level: 2, name: text("results.heroReached") })).toBeInTheDocument();
    expect(within(hero()).getByText(text("results.heroConfirming"))).toBeInTheDocument();
    expect(placementOf(hero())).toBeNull();
    expect(within(hero()).getByText("920")).toBeInTheDocument();
    expect(within(hero()).getByText("7")).toBeInTheDocument();
  });

  it("celebrates my proven place with the medal of that place", () => {
    renderResults({}, resultsFinishOrder([2, 1, 9_000], [1, 2, 9_001]));

    expect(within(hero()).getByRole("heading", { level: 2, name: text("results.heroRank", { rank: 2 }) })).toBeInTheDocument();
    expect(placementOf(hero())).toBe("silver");
  });

  it("keeps a tied first place as place one, marked as a tie", () => {
    renderResults({}, resultsFinishOrder([2, 1, 9_001], [1, 1, 9_001]));

    expect(within(hero()).getByRole("heading", { level: 2, name: text("results.heroRankTied", { rank: 1 }) })).toBeInTheDocument();
    expect(placementOf(hero())).toBe("gold");
  });

  it("shows my final server rank once the race is over", () => {
    renderResults({
      ...FINAL,
      rank: 3,
      opponents: [
        resultsOpponent(2, "FINISHED", 1),
        resultsOpponent(3, "FINISHED", 2),
        resultsOpponent(4, "FINISHED", 4),
        resultsOpponent(5, "DISCONNECTED", 5),
      ],
    });

    expect(within(hero()).getByText(text("results.heroFinalLabel"))).toBeInTheDocument();
    expect(within(hero()).getByRole("heading", { level: 2, name: text("results.heroRank", { rank: 3 }) })).toBeInTheDocument();
    expect(placementOf(hero())).toBe("bronze");
  });

  it("tells a student who did not finish the truth, with a final standing and no podium medal", () => {
    renderResults({
      ...FINAL,
      playerStatus: "DISCONNECTED",
      playerFinished: false,
      playerFinishedAtEpochMs: null,
      position: 640,
      rank: 3,
      opponents: [
        resultsOpponent(2, "FINISHED", 1),
        resultsOpponent(3, "FINISHED", 2),
        resultsOpponent(4, "RACING", 4),
        resultsOpponent(5, "DISCONNECTED", 5),
      ],
    });

    expect(within(hero()).getByRole("heading", { level: 2, name: text("results.heroRaceEnded") })).toBeInTheDocument();
    expect(within(hero()).getByText(text("results.heroNotCompleted"))).toBeInTheDocument();
    expect(within(hero()).getByText(text("results.heroFinalRanking", { rank: 3 }))).toBeInTheDocument();
    expect(placementOf(hero())).toBe("quiet");
    expect(screen.queryByText(text("results.heroRank", { rank: 3 }))).toBeNull();
  });
});

describe("StudentRaceResultsView while the race runs", () => {
  const eightPlayers = {
    playerCount: 8,
    opponents: [
      resultsOpponent(2, "FINISHED", 2),
      resultsOpponent(3, "FINISHED", 3),
      resultsOpponent(4, "RACING", 4),
      resultsOpponent(5, "RACING", 5),
      resultsOpponent(6, "RACING", 6),
      resultsOpponent(7, "RACING", 7),
      resultsOpponent(8, "DISCONNECTED", 8),
    ],
  };

  it("reports progress from statuses, never from how many places are proven", () => {
    renderResults(eightPlayers, resultsFinishOrder([1, 1], [2, 2]));

    expect(screen.getByText(text("results.progressLive", { finished: 3, racing: 4 }))).toBeInTheDocument();
    expect(screen.getByText(text("results.progressOut", { count: 1 }))).toBeInTheDocument();
    expect([...document.querySelectorAll("[data-segment]")].map((segment) => segment.dataset.count)).toEqual(["3", "4", "1"]);
    expect(screen.queryByText(text("results.finalCompleted", { finished: 2, count: 8 }))).toBeNull();
  });

  it("drops the out line when nobody left", () => {
    renderResults({ opponents: [resultsOpponent(2, "FINISHED", 2), resultsOpponent(3, "RACING", 3)], playerCount: 3 });

    expect(screen.queryByText(text("results.progressOut", { count: 0 }))).toBeNull();
  });

  it("lists the four groups with proof ranks, finish-only medals and my marker", () => {
    renderResults(
      {
        opponents: [
          resultsOpponent(2, "FINISHED", 2),
          resultsOpponent(3, "FINISHED", 3),
          resultsOpponent(4, "RACING", 4),
          resultsOpponent(5, "DISCONNECTED", 5),
        ],
      },
      resultsFinishOrder([2, 1, 9_000], [1, 2, 9_001]),
    );

    const ranked = screen.getByRole("heading", { level: 2, name: text("results.groupRanked") }).closest("section");
    expect([...ranked.querySelectorAll("li")].map((row) => row.dataset.racePlayerId)).toEqual(["2", "1"]);
    expect([rankTextOf(rowOf(2)), rankTextOf(rowOf(1))]).toEqual(["1", "2"]);
    expect(placementOf(rowOf(2))).toBe("gold");
    expect(within(rowOf(1)).getByText(text("results.you"))).toBeInTheDocument();

    expect(rankTextOf(rowOf(3))).toBeNull();
    expect(placementOf(rowOf(3))).toBeNull();
    expect(within(rowOf(3)).getByText(text("results.statusConfirming"))).toBeInTheDocument();

    expect(rankTextOf(rowOf(4))).toBeNull();
    expect(within(rowOf(4)).getByText(text("results.statusRacing"))).toBeInTheDocument();

    expect(placementOf(rowOf(5))).toBeNull();
    expect(within(rowOf(5)).getByText(text("results.statusOut"))).toBeInTheDocument();
  });

  it("shows my score only in my hero and no private numbers for anyone else", () => {
    renderResults({ score: 920, highestStreak: 7 }, resultsFinishOrder([1, 1]));

    expect(screen.getAllByText("920")).toHaveLength(1);
    for (const id of [2, 3, 4, 5]) {
      expect(rowOf(id).textContent).not.toMatch(/920|\d{2,}/);
    }
  });

  it("keeps every name isolated for mixed-direction text and readable when truncated", () => {
    renderResults({ opponents: [resultsOpponent(2, "RACING", 2, { displayName: "נועה Levi" })], playerCount: 2 });

    const name = within(rowOf(2)).getByText("נועה Levi");
    expect(name.tagName).toBe("BDI");
    expect(name.closest("[title]")).toHaveAttribute("title", "נועה Levi");
  });

  it("offers no new race while the race still runs", () => {
    renderResults();

    expect(screen.getByText(text("results.liveBadge"))).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: text("results.joinNewRace") })).toBeNull();
  });
});

describe("StudentRaceResultsView once the race is final", () => {
  const finalField = {
    ...FINAL,
    rank: 1,
    playerCount: 5,
    opponents: [
      resultsOpponent(2, "FINISHED", 1),
      resultsOpponent(3, "DISCONNECTED", 3),
      resultsOpponent(4, "FINISHED", 4),
      resultsOpponent(5, "FINISHED", 5),
    ],
  };

  it("lists final ranks 1, 1, 3, 4, 5 exactly as the server ranked them", () => {
    renderResults(finalField);

    const standings = screen.getByRole("heading", { level: 2, name: text("results.finalStandings") }).closest("section");
    const rows = [...standings.querySelectorAll("li")];
    expect(rows.map((row) => rankTextOf(row))).toEqual(["1", "1", "3", "4", "5"]);
    expect(rows.map(placementOf)).toEqual(["gold", "gold", "quiet", "wood", "wood"]);
    expect(screen.queryByText(text("results.groupRacing"))).toBeNull();
  });

  it("never gives bronze to a participant who did not finish", () => {
    renderResults(finalField);

    expect(placementOf(rowOf(3))).toBe("quiet");
    expect(within(rowOf(3)).getByText(text("results.statusDidNotFinish"))).toBeInTheDocument();
  });

  it("states how many completed the race and offers another race", () => {
    renderResults(finalField);

    expect(screen.getByText(text("results.finalBadge"))).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: text("results.finalCompleted", { finished: 4, count: 5 }) }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: text("results.joinNewRace") })).toHaveAttribute("href", "/join");
  });

  it("celebrates a race that everyone completed", () => {
    renderResults({ ...FINAL, rank: 1, playerCount: 2, opponents: [resultsOpponent(2, "FINISHED", 2)] });

    expect(screen.getByRole("heading", { level: 2, name: text("results.finalAllCompleted") })).toBeInTheDocument();
  });
});

describe("StudentRaceResultsView results art", () => {
  const DID_NOT_FINISH = {
    ...FINAL,
    playerStatus: "DISCONNECTED",
    playerFinished: false,
    playerFinishedAtEpochMs: null,
    position: 640,
    rank: 3,
    opponents: [resultsOpponent(2, "FINISHED", 1), resultsOpponent(3, "FINISHED", 2)],
    playerCount: 3,
  };

  function stage() {
    return hero().querySelector("[data-results-stage]");
  }

  function stageKart() {
    return stage().querySelectorAll("img")[1].getAttribute("src");
  }

  it("stands my own kart on the podium under the medal of my proven place", () => {
    renderResults({}, resultsFinishOrder([2, 1, 9_000], [1, 2, 9_001]));

    expect(stageKart()).toContain("hover-kart-green-front");
    expect(stage()).toHaveAttribute("aria-hidden", "true");
    expect(placementOf(hero())).toBe("silver");
    expect(hero().querySelector("[data-placement] img")).toHaveAttribute("alt", "");
  });

  it("keeps me on the podium while my place is confirmed, still without a medal", () => {
    renderResults();

    expect(stageKart()).toContain("hover-kart-green-front");
    expect(placementOf(hero())).toBeNull();
  });

  it("keeps the podium beyond the third place with the neutral placement badge around a real number", () => {
    renderResults(
      {
        rank: 4,
        opponents: [
          resultsOpponent(2, "FINISHED", 1),
          resultsOpponent(3, "FINISHED", 2),
          resultsOpponent(4, "FINISHED", 3),
          resultsOpponent(5, "RACING", 5),
        ],
      },
      resultsFinishOrder([2, 1], [3, 2], [4, 3], [1, 4, 9_009]),
    );

    expect(stage()).not.toBeNull();
    expect(placementOf(hero())).toBe("wood");
    expect(hero().querySelector("[data-placement='wood'] img")).toHaveAttribute("alt", "");
    expect(within(hero()).getByText("4")).not.toHaveClass("sr-only");
  });

  it("shows a student who did not finish a quiet side-view kart and never the podium", () => {
    renderResults(DID_NOT_FINISH);

    expect(stage()).toBeNull();
    expect(placementOf(hero())).toBe("quiet");
    expect(hero().querySelector("img").getAttribute("src")).toContain("-side");
    expect(hero().querySelector("img[src*='-front']")).toBeNull();
  });

  it("draws placement art for finished places only, wood beyond the podium", () => {
    renderResults({
      ...FINAL,
      rank: 1,
      playerCount: 4,
      opponents: [
        resultsOpponent(2, "FINISHED", 2),
        resultsOpponent(3, "DISCONNECTED", 3),
        resultsOpponent(4, "FINISHED", 4),
      ],
    });

    expect([placementOf(rowOf(2)), placementOf(rowOf(3)), placementOf(rowOf(4))]).toEqual(["silver", "quiet", "wood"]);
    expect(rowOf(3).querySelector("img[src*='race-medal'], img[src*='race-placement']")).toBeNull();
    expect(rowOf(4).querySelector("img[src*='race-placement-badge']")).not.toBeNull();
    expect([rankTextOf(rowOf(2)), rankTextOf(rowOf(3)), rankTextOf(rowOf(4))]).toEqual(["2", "3", "4"]);
    expect(rowOf(2).querySelector("img[src*='-side']")).not.toBeNull();
    expect(rowOf(2).querySelector("img[src*='-front']")).toBeNull();
  });

  it("writes the results title on the plaque as real text over decorative art", () => {
    renderResults();

    const plaque = document.querySelector("[data-results-plaque]");
    expect(within(plaque).getByText(text("results.title"))).toBeInTheDocument();
    expect(plaque.querySelector("img")).toHaveAttribute("alt", "");
    expect(plaque.querySelector("img")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps every group of the running race on one race board", () => {
    renderResults({}, resultsFinishOrder([2, 1, 9_000]));

    const boards = ["results.groupRanked", "results.groupConfirming", "results.groupRacing", "results.groupOut"].map(
      (key) => screen.getByRole("heading", { level: 2, name: text(key) }).closest("section").parentElement,
    );
    expect(new Set(boards).size).toBe(1);
  });
});

describe("StudentRaceResultsView page structure", () => {
  it("names the race in the only top-level heading, isolated for mixed-direction titles", () => {
    renderResults();

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Jungle Cup");
    expect(title.querySelector("bdi")).toHaveTextContent("Jungle Cup");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("moves focus to the race heading when the results appear", () => {
    renderResults();

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("announces my personal result politely without moving focus again", () => {
    renderResults();

    const live = within(hero()).getByText(text("results.heroConfirming")).closest("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");
  });
});
