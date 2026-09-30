import path from "node:path";
import { describe, expect, it } from "vitest";

import { STUDENT_RESULTS_TITLE_PLAQUE } from "../../../features/studentRace/config/studentRaceResultsViewConfig";
import { readWebpHeader, WEBP_CHUNKS, WEBP_RIFF_SIGNATURE } from "../../../test/readWebpHeader";
import { RACE_PLACEMENTS } from "../../components/raceRank/racePlacementConfig";
import { RACE_RESULTS_STAGE_CONFIG } from "../../components/raceResults/raceResultsStageConfig";
import { RACE_VEHICLE_COLOR_KEYS } from "../../raceVehicles/raceVehicleIdentity";
import { RACE_RESULTS_ART } from "../raceResultsArt";

const ASSET_DIRECTORY = path.resolve(import.meta.dirname, "../../../assets/game/raceResults");
const HERO_KART_SIZE = Object.freeze({ width: 512, height: 459 });
const MEDAL_SIZE = Object.freeze({ width: 320, height: 311 });

const EXPECTED_FILES = Object.freeze({
  "medals/race-medal-gold.webp": MEDAL_SIZE,
  "medals/race-medal-silver.webp": MEDAL_SIZE,
  "medals/race-medal-bronze.webp": MEDAL_SIZE,
  "medals/race-placement-badge.webp": { width: 320, height: 277 },
  "awards/award-trophy.webp": { width: 192, height: 171 },
  "awards/award-target.webp": { width: 192, height: 157 },
  "awards/award-streak.webp": { width: 192, height: 151 },
  "stats/stat-score.webp": { width: 128, height: 97 },
  "stats/stat-streak.webp": { width: 128, height: 108 },
  "stage/results-podium.webp": { width: 768, height: 469 },
  "stage/results-title-plaque.webp": { width: 512, height: 223 },
});

function readArtHeader(relativePath) {
  return readWebpHeader(path.join(ASSET_DIRECTORY, relativePath));
}

function transparentWebp(size) {
  return { riff: WEBP_RIFF_SIGNATURE, chunk: WEBP_CHUNKS.EXTENDED, hasAlpha: true, ...size };
}

describe("race results art files", () => {
  it.each(Object.entries(EXPECTED_FILES))("ships %s as a transparent WebP at its production size", (file, size) => {
    expect(readArtHeader(file)).toEqual(transparentWebp(size));
  });

  it.each(Object.values(RACE_VEHICLE_COLOR_KEYS))(
    "ships the %s front hero kart on the shared canvas",
    (color) => {
      expect(readArtHeader(`heroKarts/hover-kart-${color.toLowerCase()}-front.webp`)).toEqual(
        transparentWebp(HERO_KART_SIZE),
      );
    },
  );
});

describe("RACE_RESULTS_ART", () => {
  it("owns one distinct art file for every celebrated placement and none for the quiet one", () => {
    const celebrated = Object.values(RACE_PLACEMENTS).filter((placement) => placement !== RACE_PLACEMENTS.QUIET);

    expect(Object.keys(RACE_RESULTS_ART.placement).sort()).toEqual(celebrated.sort());
    expect(new Set(Object.values(RACE_RESULTS_ART.placement)).size).toBe(celebrated.length);
    expect(RACE_RESULTS_ART.placement.wood).toContain("race-placement-badge");
  });

  it("resolves the score star and the streak flame for every stat surface", () => {
    expect(RACE_RESULTS_ART.stats.score).toContain("stat-score");
    expect(RACE_RESULTS_ART.stats.streak).toContain("stat-streak");
  });

  it("resolves the award, podium and plaque art to shipped files", () => {
    expect(RACE_RESULTS_ART.awards.trophy).toContain("award-trophy");
    expect(RACE_RESULTS_ART.awards.target).toContain("award-target");
    expect(RACE_RESULTS_ART.awards.streak).toContain("award-streak");
    expect(RACE_RESULTS_ART.podium).toContain("results-podium");
    expect(RACE_RESULTS_ART.titlePlaque).toContain("results-title-plaque");
  });
});

describe("race results art configuration", () => {
  it("keeps the stage geometry in sync with the shipped kart and podium", () => {
    const podium = readArtHeader("stage/results-podium.webp");

    expect(RACE_RESULTS_STAGE_CONFIG.kart.aspectRatio).toBeCloseTo(HERO_KART_SIZE.width / HERO_KART_SIZE.height, 6);
    expect(RACE_RESULTS_STAGE_CONFIG.podium.aspectRatio).toBeCloseTo(podium.width / podium.height, 6);
  });

  it("keeps the title plaque text box inside the shipped plaque", () => {
    const plaque = readArtHeader("stage/results-title-plaque.webp");
    const { aspectRatio, textBox } = STUDENT_RESULTS_TITLE_PLAQUE;

    expect(aspectRatio).toBeCloseTo(plaque.width / plaque.height, 6);
    expect(textBox.left + textBox.width).toBeLessThanOrEqual(100);
    expect(textBox.top + textBox.height).toBeLessThanOrEqual(100);
  });
});
