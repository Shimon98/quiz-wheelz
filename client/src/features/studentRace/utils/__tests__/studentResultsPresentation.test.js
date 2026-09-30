import { describe, expect, it } from "vitest";

import { STUDENT_RESULTS_HERO_BADGES } from "../../config/studentRaceResultsViewConfig";
import {
  resolveResultRowMotion,
  resolveResultsEnterMotion,
  resolveResultsHero,
  resolveResultsProgressSegments,
} from "../studentResultsPresentation";

describe("resolveResultsHero", () => {
  const finisher = { finished: true, rank: 2, rankConfirmed: true, rankTied: false };

  it("puts a finisher with a proven place on the podium", () => {
    expect(resolveResultsHero({ me: finisher, raceFinished: false })).toMatchObject({
      podium: true,
      badge: STUDENT_RESULTS_HERO_BADGES.RANK,
      headlineKey: "results.heroRank",
    });
  });

  it("puts a finisher on the podium while the place is still being confirmed", () => {
    const me = { finished: true, rank: null, rankConfirmed: false, rankTied: false };

    expect(resolveResultsHero({ me, raceFinished: false })).toMatchObject({
      podium: true,
      badge: STUDENT_RESULTS_HERO_BADGES.PENDING,
      headlineKey: "results.heroReached",
    });
  });

  it("keeps a student who did not finish off the podium even with a final rank", () => {
    const me = { finished: false, rank: 3, rankConfirmed: true, rankTied: false };

    expect(resolveResultsHero({ me, raceFinished: true })).toMatchObject({
      podium: false,
      badge: STUDENT_RESULTS_HERO_BADGES.RANK,
      headlineKey: "results.heroRaceEnded",
    });
  });
});

describe("resolveResultsProgressSegments", () => {
  it("sizes the finished, racing and out segments from status counts only", () => {
    expect(resolveResultsProgressSegments({ finished: 3, racing: 4, out: 1 })).toEqual([
      { id: "finished", count: 3, percent: 37.5 },
      { id: "racing", count: 4, percent: 50 },
      { id: "out", count: 1, percent: 12.5 },
    ]);
  });

  it("keeps every segment empty before anyone is counted", () => {
    expect(resolveResultsProgressSegments({ finished: 0, racing: 0, out: 0 }).map((segment) => segment.percent)).toEqual([
      0, 0, 0,
    ]);
  });
});

describe("resolveResultRowMotion", () => {
  it("moves a row between sections with a short shared-layout transition", () => {
    const motion = resolveResultRowMotion(7, false);

    expect(motion).toMatchObject({ layout: "position", layoutId: "student-result-7" });
    expect(motion.transition.duration).toBeGreaterThanOrEqual(0.28);
    expect(motion.transition.duration).toBeLessThanOrEqual(0.3);
  });

  it("drops all row movement when the student prefers reduced motion", () => {
    expect(resolveResultRowMotion(7, true)).toEqual({ layout: false });
  });
});

describe("resolveResultsEnterMotion", () => {
  it("fades the page in briefly", () => {
    const motion = resolveResultsEnterMotion(false);

    expect(motion.initial).toMatchObject({ opacity: 0 });
    expect(motion.animate).toMatchObject({ opacity: 1 });
    expect(motion.transition.duration).toBeGreaterThan(0);
  });

  it("keeps the fully visible target but skips the fade when the student prefers reduced motion", () => {
    const motion = resolveResultsEnterMotion(true);

    expect(motion.animate).toMatchObject({ opacity: 1 });
    expect(motion.transition).toEqual({ duration: 0 });
  });
});
