import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
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

function renderPanel(props) {
  return render(
    <MantineProvider>
      <StudentRaceQuestionPanel question={question()} {...props} />
    </MantineProvider>,
  );
}

// Luck notices left the card for their own line: see StudentRaceLuckNotice.test.jsx and StudentRaceOverlay.luck.test.jsx.
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
