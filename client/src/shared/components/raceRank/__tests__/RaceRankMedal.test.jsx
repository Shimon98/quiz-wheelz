import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import RaceRankMedal from "../RaceRankMedal";
import { RACE_RANK_MEDAL_SIZES, resolveRaceRankMedal } from "../raceRankMedalConfig";

describe("resolveRaceRankMedal", () => {
  it.each([
    [1, "gold"],
    [2, "silver"],
    [3, "bronze"],
    [4, null],
    [8, null],
    [null, null],
  ])("maps server rank %s to %s", (rank, medal) => {
    expect(resolveRaceRankMedal(rank)).toBe(medal);
  });
});

describe("RaceRankMedal", () => {
  it("renders a podium medal with the rank as real text", () => {
    const { container } = render(<RaceRankMedal rank={1} medal="gold" />);

    expect(container.querySelector("[data-medal]")).toHaveAttribute("data-medal", "gold");
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the plain rank badge when the caller gives no medal", () => {
    const { container } = render(<RaceRankMedal rank={3} medal={null} accentColor="#22c55e" />);

    expect(container.querySelector("[data-medal]")).toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(container.firstChild.style.getPropertyValue("--qw-lane-accent")).toBe("#22c55e");
  });

  it("inherits the accent from its row when no accent is given", () => {
    const { container } = render(<RaceRankMedal rank={5} />);

    expect(container.firstChild.getAttribute("style")).toBeNull();
  });

  it("scales every size from one medal size variable and falls back to the small size", () => {
    const { container, rerender } = render(
      <RaceRankMedal rank={2} medal="silver" size={RACE_RANK_MEDAL_SIZES.XL} />,
    );
    expect(container.firstChild.className).toContain("[--qw-medal-size:5.5rem]");

    rerender(<RaceRankMedal rank={2} medal="silver" size="huge" />);
    expect(container.firstChild.className).toContain("[--qw-medal-size:1.75rem]");
  });
});
