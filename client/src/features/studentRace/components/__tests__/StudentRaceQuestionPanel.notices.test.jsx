import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import StudentRaceQuestionPanel from "../StudentRaceQuestionPanel";

const NOW = 1_700_000_000_000;

function question(gameplayContext = "NORMAL") {
  return {
    id: 5,
    gameplayContext,
    text: "6 × 7 = ?",
    timeLimitSeconds: 20,
    expiresAtEpochMs: NOW + 15000,
    serverClockOffsetMs: 0,
    choices: [{ id: 1, text: "42" }, { id: 2, text: "36" }],
  };
}

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

function luckWindow(type, endsAtEpochMs) {
  return {
    effectId: 1, type, source: "LUCK_EVENT", magnitudeTenths: 1, startsAtEpochMs: NOW - 500, endsAtEpochMs,
    serverClockOffsetMs: 0,
  };
}

function luckEvent(appliedType, outcome, occurredAtEpochMs = NOW - 500) {
  return { eventId: 9, selectedType: appliedType, appliedType, outcome, occurredAtEpochMs, serverClockOffsetMs: 0 };
}

function renderPanel(props) {
  return render(
    <MantineProvider>
      <StudentRaceQuestionPanel question={question()} {...props} />
    </MantineProvider>,
  );
}

const instruction = () => i18n.t("studentRace:question.instruction");

describe("StudentRaceQuestionPanel Luck notices", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ["a Tailwind window", { activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] }, "gameplay.luck.tailwind"],
    ["a Mud window", { activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] }, "gameplay.luck.mud"],
    ["an Energy Orb", { recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }, "gameplay.luck.energyOrb"],
    ["a Mud Splash the shield blocked", { recentEvents: [luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD")] },
      "gameplay.luck.shieldBlocked"],
  ])("tells the student about %s in the instruction line", (_, parts, key) => {
    renderPanel({ gameplay: gameplay(parts), announcedLuckEventId: 9 });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t(`studentRace:${key}`));
    expect(screen.queryByText(instruction())).not.toBeInTheDocument();
  });

  // A refresh or a reconnect starts the screen from a baseline that announces nothing.
  it.each([
    ["an Energy Orb", luckEvent("ENERGY_ORB", "APPLIED")],
    ["a Mud Splash the shield blocked", luckEvent("MUD_SPLASH", "BLOCKED_BY_SHIELD")],
  ])("does not tell %s again when this screen never announced it", (_, event) => {
    renderPanel({ gameplay: gameplay({ recentEvents: [event] }) });

    expect(screen.getByText(instruction())).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps telling a Luck window that is still open, announced or not", () => {
    renderPanel({ gameplay: gameplay({ activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] }) });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.luck.tailwind"));
  });

  it("puts the instruction back once the Mud window closes", () => {
    renderPanel({ gameplay: gameplay({ activeEffects: [luckWindow("SPEED_SLOW", NOW + 2000)] }) });

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByText(instruction())).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps an Energy Orb as news only for a short while", () => {
    renderPanel({ gameplay: gameplay({ recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }), announcedLuckEventId: 9 });

    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.luckNoticeMs - 500));

    expect(screen.getByText(instruction())).toBeInTheDocument();
  });

  it("stays quiet about Luck that is old news", () => {
    const old = luckEvent("ENERGY_ORB", "APPLIED", NOW - STUDENT_RACE_CONFIG.luckNoticeMs);

    renderPanel({ gameplay: gameplay({ recentEvents: [old] }), announcedLuckEventId: 9 });

    expect(screen.getByText(instruction())).toBeInTheDocument();
  });

  it("lets the challenge slowdown notice outrank Luck", () => {
    renderPanel({
      slowdownNoticeKey: "gameplay.turboSlowdownNotice",
      gameplay: gameplay({ recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }),
      announcedLuckEventId: 9,
    });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.turboSlowdownNotice"));
  });

  it("keeps the mode badge on a challenge question right after Luck", () => {
    renderPanel({
      question: question("TURBO_TRIAL"),
      gameplay: gameplay({ recentEvents: [luckEvent("ENERGY_ORB", "APPLIED")] }),
      announcedLuckEventId: 9,
    });

    expect(screen.getByText(i18n.t("studentRace:gameplay.turbo.title"))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("studentRace:gameplay.luck.energyOrb"))).not.toBeInTheDocument();
  });

  it("lets answer feedback replace a Luck notice", () => {
    renderPanel({
      feedbackState: "correct",
      selectedChoiceId: 1,
      gameplay: gameplay({ activeEffects: [luckWindow("SPEED_BOOST", NOW + 3000)] }),
    });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:question.correctFeedback"));
  });
});

describe("StudentRaceQuestionPanel with no usable question", () => {
  const unavailable = Object.freeze({
    status: 409,
    errorName: "QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER",
    category: "CONFLICT",
    messageKey: "question.unavailable",
  });

  it("tells the student to ask the teacher instead of showing a generic conflict", () => {
    renderPanel({ question: null, error: unavailable, onRetry: vi.fn() });

    expect(screen.getByText(i18n.t("errors:question.unavailable"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("studentRace:status.retry") })).toBeInTheDocument();
  });

  it("says the same while the next question is awaited, keeping the manual retry", () => {
    renderPanel({ isAwaitingNextQuestion: true, error: unavailable, onRetry: vi.fn() });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("errors:question.unavailable"));
    expect(screen.getByRole("button", { name: i18n.t("studentRace:status.retry") })).toBeInTheDocument();
  });

  it("keeps the short title for any other failure while the next question is awaited", () => {
    renderPanel({ isAwaitingNextQuestion: true, error: { category: "NETWORK", messageKey: "network" }, onRetry: vi.fn() });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:question.errorTitle"));
  });
});
