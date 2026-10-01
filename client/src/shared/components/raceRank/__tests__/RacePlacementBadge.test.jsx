import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RACE_RESULTS_ART } from "../../../raceResults/raceResultsArt";
import RacePlacementBadge from "../RacePlacementBadge";
import { RACE_PLACEMENT_SIZES, RACE_PLACEMENTS, resolveRacePlacement } from "../racePlacementConfig";

function placementOf(container) {
  return container.querySelector("[data-placement]");
}

describe("resolveRacePlacement", () => {
  it.each([
    [1, RACE_PLACEMENTS.GOLD],
    [2, RACE_PLACEMENTS.SILVER],
    [3, RACE_PLACEMENTS.BRONZE],
    [4, RACE_PLACEMENTS.WOOD],
    [8, RACE_PLACEMENTS.WOOD],
  ])("gives an eligible rank %s the %s art", (rank, placement) => {
    expect(resolveRacePlacement(rank, true)).toEqual({ placement, art: RACE_RESULTS_ART.placement[placement] });
  });

  it.each([
    [1, false],
    [4, false],
    [null, true],
    [0, true],
    [2.5, true],
  ])("keeps rank %s quiet when eligibility is %s", (rank, eligible) => {
    expect(resolveRacePlacement(rank, eligible)).toEqual({ placement: RACE_PLACEMENTS.QUIET, art: null });
  });

  it("uses one wooden art file for every place beyond the podium", () => {
    expect(resolveRacePlacement(4, true).art).toBe(resolveRacePlacement(8, true).art);
  });
});

describe("RacePlacementBadge", () => {
  it.each([
    [1, "gold"],
    [2, "silver"],
    [3, "bronze"],
  ])("draws the %s place as decorative %s art and keeps the rank as real text", (rank, placement) => {
    const { container } = render(<RacePlacementBadge rank={rank} placementArtEligible />);
    const art = placementOf(container).querySelector("img");

    expect(placementOf(container)).toHaveAttribute("data-placement", placement);
    expect(art).toHaveAttribute("src", RACE_RESULTS_ART.placement[placement]);
    expect(art).toHaveAttribute("alt", "");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText(String(rank))).toHaveClass("sr-only");
  });

  it.each([4, 8])("frames place %s with the wooden badge and a visible rank number", (rank) => {
    const { container } = render(<RacePlacementBadge rank={rank} placementArtEligible />);

    expect(placementOf(container)).toHaveAttribute("data-placement", "wood");
    expect(placementOf(container).querySelector("img")).toHaveAttribute("src", RACE_RESULTS_ART.placement.wood);
    expect(screen.getByText(String(rank))).not.toHaveClass("sr-only");
  });

  it.each([1, 4])("keeps an ineligible place %s as a quiet number in the lane color", (rank) => {
    const { container } = render(<RacePlacementBadge rank={rank} accentColor="#22c55e" />);

    expect(placementOf(container)).toHaveAttribute("data-placement", "quiet");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(String(rank))).toBeInTheDocument();
    expect(placementOf(container).style.getPropertyValue("--qw-lane-accent")).toBe("#22c55e");
  });

  it("inherits the lane accent from its row when no accent is given", () => {
    const { container } = render(<RacePlacementBadge rank={5} />);

    expect(placementOf(container).getAttribute("style")).toBeNull();
  });

  it("draws the same placement at every size from one size variable and falls back to the compact one", () => {
    const { container, rerender } = render(
      <RacePlacementBadge rank={4} placementArtEligible size={RACE_PLACEMENT_SIZES.XL} />,
    );
    expect(placementOf(container)).toHaveAttribute("data-placement", "wood");
    expect(placementOf(container).className).toContain("[--qw-placement-size:clamp(5.5rem,13.5dvh,9rem)]");

    rerender(<RacePlacementBadge rank={4} placementArtEligible size={RACE_PLACEMENT_SIZES.SM} />);
    expect(placementOf(container)).toHaveAttribute("data-placement", "wood");
    expect(placementOf(container).className).toContain("[--qw-placement-size:2rem]");

    rerender(<RacePlacementBadge rank={4} size="huge" />);
    expect(placementOf(container)).toHaveAttribute("data-placement", "quiet");
    expect(placementOf(container).className).toContain("[--qw-placement-size:2rem]");
  });
});
