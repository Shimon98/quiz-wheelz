import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import i18n from "../../../../i18n/i18n";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import StudentRaceOverlay from "../StudentRaceOverlay";

const NOW = 1_700_000_000_000;

function buildQuestion() {
  return {
    id: 1, gameplayContext: "NORMAL", text: "3 + 4 = ?", timeLimitSeconds: 20, expiresAtEpochMs: NOW + 15000,
    serverClockOffsetMs: 0, choices: [{ id: 1, text: "7" }, { id: 2, text: "8" }],
  };
}

function withLuck({ activeEffects = [], recentEvents = [] }) {
  const runtimeState = createInitialRaceRuntimeState();
  runtimeState.gameplay = { ...runtimeState.gameplay, activeEffects, luck: { recentEvents } };
  return runtimeState;
}

const orb = (occurredAtEpochMs = NOW - 300) => ({
  eventId: 9, selectedType: "ENERGY_ORB", appliedType: "ENERGY_ORB", outcome: "APPLIED", occurredAtEpochMs,
  serverClockOffsetMs: 0,
});
const tailwindWindow = {
  effectId: 3, type: "SPEED_BOOST", source: "LUCK_EVENT", magnitudeTenths: 2, startsAtEpochMs: NOW - 300,
  endsAtEpochMs: NOW + 3700, serverClockOffsetMs: 0,
};
const text = (key) => i18n.t(`studentRace:${key}`);

// The question card's single status line belongs to the answer feedback and the next question; Luck keeps its own.
describe("StudentRaceOverlay Luck line", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("tells an Energy Orb beside the right-answer feedback", () => {
    render(<StudentRaceOverlay runtimeState={withLuck({ recentEvents: [orb()] })} announcedLuckEventId={9}
      question={buildQuestion()} feedbackState="correct" selectedChoiceId={1} />);

    expect(screen.getByText(new RegExp(text("question.correctFeedback")))).toBeInTheDocument();
    expect(screen.getByText(text("gameplay.luck.energyOrb"))).toBeInTheDocument();
  });

  it("tells a Tailwind beside the wrong-answer feedback", () => {
    render(<StudentRaceOverlay runtimeState={withLuck({ activeEffects: [tailwindWindow] })}
      question={buildQuestion()} feedbackState="wrong" selectedChoiceId={2} correctAnswerChoiceId={1} />);

    expect(screen.getByText(new RegExp(text("question.wrongFeedback")))).toBeInTheDocument();
    expect(screen.getByText(text("gameplay.luck.tailwind"))).toBeInTheDocument();
  });

  it("keeps the notice while the next question loads slowly, for the notice's own time only", () => {
    render(<StudentRaceOverlay runtimeState={withLuck({ recentEvents: [orb()] })} announcedLuckEventId={9}
      question={buildQuestion()} isAwaitingNextQuestion />);

    expect(screen.getByText(text("question.loadingNext"))).toBeInTheDocument();
    expect(screen.getByText(text("gameplay.luck.energyOrb"))).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByText(text("gameplay.luck.energyOrb"))).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.luckNoticeMs - 2500));
    expect(screen.queryByText(text("gameplay.luck.energyOrb"))).not.toBeInTheDocument();
    expect(screen.getByText(text("question.loadingNext"))).toBeInTheDocument();
  });

  it("keeps the notice when there is no question at all", () => {
    render(<StudentRaceOverlay runtimeState={withLuck({ activeEffects: [tailwindWindow] })} question={null} />);

    expect(screen.getByText(text("gameplay.luck.tailwind"))).toBeInTheDocument();
  });

  it("keeps the notice while the challenge cards replace the question", () => {
    const offer = { offerId: 4, expiresAtEpochMs: NOW + 9000, serverClockOffsetMs: 0, choices: ["TURBO_TRIAL", "SAFE_RUN"] };

    render(<StudentRaceOverlay runtimeState={withLuck({ recentEvents: [orb()] })} announcedLuckEventId={9}
      question={buildQuestion()} interactionEnabled
      challenge={{ visible: true, offer, openChoices: offer.choices, onChoose: () => {} }} />);

    expect(screen.getByText(text("gameplay.luck.energyOrb"))).toBeInTheDocument();
  });

  it("tells Luck once, leaving the card's line its plain instruction", () => {
    render(<StudentRaceOverlay runtimeState={withLuck({ activeEffects: [tailwindWindow] })} question={buildQuestion()} />);

    expect(screen.getAllByText(text("gameplay.luck.tailwind"))).toHaveLength(1);
    expect(screen.getByText(text("question.instruction"))).toBeInTheDocument();
  });
});
