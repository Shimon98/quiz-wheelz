import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { useReducedMotion } from "framer-motion";

import i18n from "../../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../../i18n/i18nConstants";
import TeacherLeaderboardPanel from "../TeacherLeaderboardPanel";

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal()),
  useReducedMotion: vi.fn(() => false),
}));

function row(racePlayerId, rank, overrides = {}) {
  return {
    racePlayerId,
    rank,
    displayName: `Player ${racePlayerId}`,
    accentColor: "#2fa84f",
    progressPercent: 40,
    score: 10,
    streak: 0,
    status: "RACING",
    ...overrides,
  };
}

function panel(rows) {
  return (
    <MantineProvider>
      <TeacherLeaderboardPanel rows={rows} />
    </MantineProvider>
  );
}

function renderedIds() {
  return screen
    .getAllByRole("listitem")
    .map((item) => Number(item.getAttribute("data-race-player-id")));
}

function rowElement(racePlayerId) {
  return document.querySelector(`[data-race-player-id="${racePlayerId}"]`);
}

function renderedTiers() {
  return screen.getAllByRole("listitem").map((item) => item.getAttribute("data-rank-tier"));
}

afterEach(() => {
  vi.mocked(useReducedMotion).mockReturnValue(false);
});

describe("TeacherLeaderboardPanel ordering", () => {
  it("renders rows exactly in the order it receives and never sorts by rank itself", () => {
    render(panel([row(3, 3), row(1, 1), row(2, 2)]));

    expect(renderedIds()).toEqual([3, 1, 2]);
  });

  it("moves the same row element to its new place when the standings order changes", () => {
    const { rerender } = render(panel([row(1, 1), row(2, 2), row(3, 3), row(4, 4)]));
    const maya = rowElement(2);
    const dan = rowElement(1);

    rerender(panel([row(2, 1), row(1, 2), row(4, 3), row(3, 4)]));

    expect(renderedIds()).toEqual([2, 1, 4, 3]);
    expect(rowElement(2)).toBe(maya);
    expect(rowElement(1)).toBe(dan);
    expect(within(maya).getByText("1")).toBeInTheDocument();
  });

  it("ends rapid successive standings updates at the latest order with one row per player", () => {
    const standings = [
      [row(1, 1), row(2, 2), row(3, 3), row(4, 4)],
      [row(1, 1), row(4, 2), row(2, 3), row(3, 4)],
      [row(4, 1), row(1, 2), row(2, 3), row(3, 4)],
      [row(1, 1), row(2, 2), row(4, 3), row(3, 4)],
    ];
    const { rerender } = render(panel(standings[0]));
    const elements = new Map([1, 2, 3, 4].map((id) => [id, rowElement(id)]));

    for (const next of standings.slice(1)) {
      rerender(panel(next));
    }

    const ids = renderedIds();
    expect(ids).toEqual([1, 2, 4, 3]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [id, element] of elements) {
      expect(rowElement(id)).toBe(element);
    }
  });

  it("still lands on the correct order when reduced motion turns the slide off", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { rerender } = render(panel([row(1, 1), row(2, 2), row(3, 3)]));

    rerender(panel([row(3, 1), row(1, 2), row(2, 3)]));

    expect(renderedIds()).toEqual([3, 1, 2]);
  });
});

describe("TeacherLeaderboardPanel rank tiers", () => {
  it("maps server rank 1, 2 and 3 to the podium tiers and the rest to none", () => {
    render(panel([row(1, 1), row(2, 2), row(3, 3), row(4, 4), row(5, 5)]));

    expect(renderedTiers()).toEqual(["first", "second", "third", "none", "none"]);
  });

  it("gives tied ranks the same tier without inventing a new order", () => {
    render(panel([row(1, 1), row(2, 1), row(3, 3)]));

    expect(renderedTiers()).toEqual(["first", "first", "third"]);
    expect(renderedIds()).toEqual([1, 2, 3]);
  });

  it("keeps a disconnected leader on the first tier with the disconnected status visible", () => {
    render(panel([row(1, 1, { status: "DISCONNECTED" }), row(2, 2)]));
    const leader = rowElement(1);

    expect(leader).toHaveAttribute("data-rank-tier", "first");
    expect(
      within(leader).getByRole("img", {
        name: i18n.t(`${I18N_NAMESPACES.TEACHER_LIVE_RACE}:playerStatus.disconnected`),
      }),
    ).toBeInTheDocument();
  });
});

describe("TeacherLeaderboardPanel podium medals", () => {
  function medals() {
    return screen.getAllByRole("listitem").map(
      (item) => item.querySelector("[data-medal]")?.getAttribute("data-medal") ?? null,
    );
  }

  it("shows gold, silver and bronze medals for server ranks 1, 2 and 3 and the plain badge after that", () => {
    render(panel([row(1, 1), row(2, 2), row(3, 3), row(4, 4)]));

    expect(medals()).toEqual(["gold", "silver", "bronze", null]);
    expect(screen.getAllByRole("listitem").map((item) => item.children[0].textContent)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("gives tied leaders two gold medals and never invents a silver one", () => {
    render(panel([row(1, 1), row(2, 1), row(3, 3)]));

    expect(medals()).toEqual(["gold", "gold", "bronze"]);
  });

  it("moves the medal with the same row element when the standings change", () => {
    const { rerender } = render(panel([row(1, 1), row(2, 2), row(3, 3), row(4, 4)]));
    const climber = rowElement(4);

    rerender(panel([row(4, 1), row(1, 2), row(2, 3), row(3, 4)]));

    expect(rowElement(4)).toBe(climber);
    expect(medals()).toEqual(["gold", "silver", "bronze", null]);
    expect(rowElement(3).querySelector("[data-medal]")).toBeNull();
  });

  it("renders the correct medals immediately with reduced motion", () => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { rerender } = render(panel([row(1, 1), row(2, 2), row(3, 3)]));

    rerender(panel([row(3, 1), row(1, 2), row(2, 3)]));

    expect(renderedIds()).toEqual([3, 1, 2]);
    expect(medals()).toEqual(["gold", "silver", "bronze"]);
  });
});
