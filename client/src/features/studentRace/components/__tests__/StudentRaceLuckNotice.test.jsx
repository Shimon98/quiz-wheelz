import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import i18n from "../../../../i18n/i18n";
import { RACE_MOMENT_ART } from "../../../../shared/raceMoments/raceMomentArt";
import { RACE_RESULTS_ART } from "../../../../shared/raceResults/raceResultsArt";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import StudentRaceLuckNotice from "../StudentRaceLuckNotice";

const NOW = 1_700_000_000_000;

function gameplay({ activeEffects = [], recentEvents = [] } = {}) {
  return {
    mode: "NORMAL",
    effectiveSpeed: 1,
    activeEffects,
    challenge: null,
    powerUps: { guardShieldCharges: 0, guardShieldAwardQuestionId: null },
    luck: { recentEvents },
  };
}

function luckWindow(type, endsAtEpochMs, startsAtEpochMs = NOW - 500) {
  return { effectId: 1, type, source: "LUCK_EVENT", magnitudeTenths: 1, startsAtEpochMs, endsAtEpochMs, serverClockOffsetMs: 0 };
}

function luckEvent(appliedType, outcome, occurredAtEpochMs = NOW - 500, eventId = 9) {
  return { eventId, selectedType: appliedType, appliedType, outcome, occurredAtEpochMs, serverClockOffsetMs: 0 };
}

const text = (key) => i18n.t(`studentRace:${key}`);
const region = (container) => container.querySelector("[aria-live='polite']");

describe("StudentRaceLuckNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ["a Tailwind window", { activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] }, "gameplay.luck.tailwind", "good"],
    ["a Mud window", { activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] }, "gameplay.luck.mud", "setback"],
    ["an Energy Orb", { recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }, "gameplay.luck.energyOrb", "good"],
    ["a Mud Splash the shield blocked", { recentEvents: [luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD")] },
      "gameplay.luck.shieldBlocked", "good"],
  ])("tells the student about %s in its own polite live line", (_, parts, key, tone) => {
    const { container } = render(<StudentRaceLuckNotice gameplay={gameplay(parts)} announcedLuckEventId={9} />);

    expect(region(container)).toHaveTextContent(text(key));
    expect(region(container)).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByText(text(key)).closest(".race-luck-notice")).toHaveAttribute("data-tone", tone);
  });

  // The live region exists before any notice, so a screen reader announces a notice once, when it appears.
  it("keeps an empty live line when there is nothing to tell", () => {
    const { container } = render(<StudentRaceLuckNotice gameplay={gameplay()} />);

    expect(region(container)).toBeInTheDocument();
    expect(region(container)).toBeEmptyDOMElement();
  });

  // A refresh or a reconnect starts the screen from a baseline that announces nothing.
  it.each([
    ["an Energy Orb", luckEvent("ENERGY_ORB", "APPLIED")],
    ["a Mud Splash the shield blocked", luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD")],
  ])("does not tell %s again when this screen never announced it", (_, event) => {
    const { container } = render(<StudentRaceLuckNotice gameplay={gameplay({ recentEvents: [event] })} />);

    expect(region(container)).toBeEmptyDOMElement();
  });

  it("keeps telling a Luck window that is still open, announced or not", () => {
    const { container } = render(
      <StudentRaceLuckNotice gameplay={gameplay({ activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] })} />,
    );

    expect(region(container)).toHaveTextContent(text("gameplay.luck.tailwind"));
  });

  it("goes quiet when the Mud window closes", () => {
    const { container } = render(
      <StudentRaceLuckNotice gameplay={gameplay({ activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] })} />,
    );

    act(() => vi.advanceTimersByTime(2000));

    expect(region(container)).toBeEmptyDOMElement();
  });

  it("tells an Energy Orb for its whole news time and not longer", () => {
    const { container } = render(
      <StudentRaceLuckNotice gameplay={gameplay({ recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] })}
        announcedLuckEventId={9} />,
    );

    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.luckNoticeMs - 600));
    expect(region(container)).toHaveTextContent(text("gameplay.luck.energyOrb"));

    act(() => vi.advanceTimersByTime(100));
    expect(region(container)).toBeEmptyDOMElement();
  });

  it("stays quiet about Luck that is old news", () => {
    const old = luckEvent("ENERGY_ORB", "APPLIED", NOW - STUDENT_RACE_CONFIG.luckNoticeMs);
    const { container } = render(
      <StudentRaceLuckNotice gameplay={gameplay({ recentEvents: [old] })} announcedLuckEventId={9} />,
    );

    expect(region(container)).toBeEmptyDOMElement();
  });

  // Mounted for the whole race, the line rests through a long quiet stretch and still tells fresh Luck at once.
  it("tells a fresh Tailwind on the render it arrives after 95 s of quiet", () => {
    const view = render(<StudentRaceLuckNotice gameplay={gameplay()} />);
    act(() => vi.advanceTimersByTime(95_000));
    const arrivedAt = NOW + 95_000;

    view.rerender(<StudentRaceLuckNotice announcedLuckEventId={9} gameplay={gameplay({
      activeEffects: [luckWindow("SPEED_BOOST", arrivedAt + 4000, arrivedAt)],
      recentEvents: [luckEvent("TAILWIND", "APPLIED", arrivedAt)],
    })} />);

    expect(region(view.container)).toHaveTextContent(text("gameplay.luck.tailwind"));
  });

  // C5-05: a climb in place is told on this same line, with the place the server gave.
  it.each([
    ["a climb", "RANK_UP", 2, "gameplay.rank.up"],
    ["the lead", "TOOK_LEAD", 1, "gameplay.rank.lead"],
  ])("tells %s in the same polite line, the only live one", (_, type, rank, key) => {
    const rankNews = { type: STUDENT_RACE_MOMENT[type], id: "rank-1", rank, identity: "7:1", announcedAtEpochMs: NOW,
      showFromEpochMs: NOW };
    const { container } = render(<StudentRaceLuckNotice gameplay={gameplay()} rankNews={rankNews} />);

    expect(region(container)).toHaveTextContent(i18n.t(`studentRace:${key}`, { rank }));
    expect(screen.getByText(i18n.t(`studentRace:${key}`, { rank })).closest(".race-luck-notice"))
      .toHaveAttribute("data-tone", "good");
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(1);
  });

  // Astra V5: the line's painting at 20 px; the lead keeps the gold medal the results already give first place.
  const rankNews = (type, rank) => ({ type: STUDENT_RACE_MOMENT[type], id: "rank-1", rank, identity: "7:1",
    announcedAtEpochMs: NOW, showFromEpochMs: NOW });
  it.each([
    ["a Tailwind", { gameplay: gameplay({ activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] }) },
      RACE_MOMENT_ART.luckTailwind],
    ["an Energy Orb", { gameplay: gameplay({ recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }) },
      RACE_MOMENT_ART.luckEnergyOrb],
    ["a Mud window", { gameplay: gameplay({ activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] }) },
      RACE_MOMENT_ART.luckMud],
    ["a blocked Mud Splash", { gameplay: gameplay({ recentEvents: [luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD")] }) },
      RACE_MOMENT_ART.luckShieldBlocked],
    ["a climb", { gameplay: gameplay(), rankNews: rankNews("RANK_UP", 2) }, RACE_MOMENT_ART.rankUp],
    ["the lead", { gameplay: gameplay(), rankNews: rankNews("TOOK_LEAD", 1) }, RACE_RESULTS_ART.placement.gold],
  ])("paints %s beside its words at 20 px", (_, props, art) => {
    const { container } = render(<StudentRaceLuckNotice announcedLuckEventId={9} {...props} />);
    const image = region(container).querySelector("img");

    expect(art).toBeTruthy();
    expect(image).toHaveAttribute("src", art);
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden", "true");
    expect(image).toHaveClass("size-5");
    expect(region(container).querySelector("svg")).toBeNull();
  });

  it("falls back to today's line icon when the painting does not load", () => {
    const { container } = render(<StudentRaceLuckNotice announcedLuckEventId={9}
      gameplay={gameplay({ activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] })} />);

    fireEvent.error(region(container).querySelector("img"));

    expect(region(container).querySelector("img")).toBeNull();
    expect(region(container).querySelector("svg.race-luck-notice-icon.lucide-droplets")).not.toBeNull();
    expect(region(container)).toHaveTextContent(text("gameplay.luck.mud"));
  });
});
