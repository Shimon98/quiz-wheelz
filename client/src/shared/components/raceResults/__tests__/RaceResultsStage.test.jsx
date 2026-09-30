import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { RACE_RESULTS_ART } from "../../../raceResults/raceResultsArt";
import RaceResultsStage from "../RaceResultsStage";
import { RACE_RESULTS_STAGE_CONFIG } from "../raceResultsStageConfig";
import { resolveRaceResultsStageGeometry } from "../resolveRaceResultsStageGeometry";

const KART_URL = "/assets/hover-kart-red-front.webp";

describe("resolveRaceResultsStageGeometry", () => {
  const config = RACE_RESULTS_STAGE_CONFIG;
  const geometry = resolveRaceResultsStageGeometry(config);
  const stageHeight = 1 / geometry.stageAspectRatio;
  const kartHeight = geometry.kartWidthPercent / 100 / config.kart.aspectRatio;
  const podiumHeight = 1 / config.podium.aspectRatio;

  it("lands the hover pads of the kart on the platform surface of the podium", () => {
    const padLine = (geometry.kartTopPercent / 100) * stageHeight + config.kart.padBottomY * kartHeight;
    const surfaceLine = (geometry.podiumTopPercent / 100) * stageHeight + config.podium.surfaceCenterY * podiumHeight;

    expect(padLine).toBeCloseTo(surfaceLine, 6);
  });

  it("keeps the whole kart and the whole podium inside the stage", () => {
    expect(geometry.kartTopPercent).toBeGreaterThanOrEqual(0);
    expect(geometry.podiumTopPercent).toBeGreaterThanOrEqual(0);
    expect((geometry.kartTopPercent / 100) * stageHeight + kartHeight).toBeLessThanOrEqual(stageHeight + 1e-9);
    expect((geometry.podiumTopPercent / 100) * stageHeight + podiumHeight).toBeCloseTo(stageHeight, 6);
  });

  it("makes the podium wider than the kart so the flags frame it", () => {
    expect(geometry.kartWidthPercent).toBeCloseTo(100 / config.podiumToKartWidth, 6);
    expect(geometry.kartWidthPercent).toBeLessThan(100);
  });

  it("grows the stage downwards when a kart stands lower than the podium", () => {
    const low = resolveRaceResultsStageGeometry({
      podiumToKartWidth: 1,
      kart: { aspectRatio: 1, padBottomY: 0.5 },
      podium: { aspectRatio: 2, surfaceCenterY: 1 },
    });

    expect(low.podiumTopPercent).toBe(0);
    expect(low.kartTopPercent).toBe(0);
    expect(low.stageAspectRatio).toBeCloseTo(1, 6);
  });
});

describe("RaceResultsStage", () => {
  it("draws the podium behind the given kart as one decorative picture", () => {
    const { container } = render(<RaceResultsStage kartSrc={KART_URL} className="w-40" />);
    const stage = container.querySelector("[data-results-stage]");
    const images = [...stage.querySelectorAll("img")];

    expect(stage).toHaveAttribute("aria-hidden", "true");
    expect(stage.className).toContain("w-40");
    expect(images.map((image) => image.getAttribute("src"))).toEqual([RACE_RESULTS_ART.podium, KART_URL]);
    expect(images.every((image) => image.getAttribute("alt") === "")).toBe(true);
  });

  it("sizes both layers from the measured stage geometry", () => {
    const { container } = render(<RaceResultsStage kartSrc={KART_URL} />);
    const stage = container.querySelector("[data-results-stage]");
    const geometry = resolveRaceResultsStageGeometry(RACE_RESULTS_STAGE_CONFIG);

    expect(Number(stage.style.getPropertyValue("--qw-stage-aspect"))).toBeCloseTo(geometry.stageAspectRatio, 6);
    expect(stage.style.getPropertyValue("--qw-stage-kart-w")).toBe(`${geometry.kartWidthPercent}%`);
    expect(stage.style.getPropertyValue("--qw-stage-podium-top")).toBe(`${geometry.podiumTopPercent}%`);
  });
});
