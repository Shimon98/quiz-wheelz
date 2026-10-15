import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import StudentRaceQuestionPanel from "../StudentRaceQuestionPanel";

function question(gameplayContext = "NORMAL") {
  return {
    id: 5,
    gameplayContext,
    text: "6 × 7 = ?",
    timeLimitSeconds: 20,
    expiresAtEpochMs: Date.now() + 15000,
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

function surfaceOf(text) {
  return screen.getByText(text).closest(".race-panel-surface");
}

const retryName = () => i18n.t("studentRace:status.retry");

describe("StudentRaceQuestionPanel gameplay presentation", () => {
  it("keeps the plain instruction and a neutral surface for a NORMAL question", () => {
    renderPanel();

    expect(screen.getByText(i18n.t("studentRace:question.instruction"))).toBeInTheDocument();
    expect(surfaceOf("6 × 7 = ?")).toHaveAttribute("data-gameplay", "NORMAL");
  });

  it.each([
    ["TURBO_TRIAL", "studentRace:gameplay.turbo.title"],
    ["SAFE_RUN", "studentRace:gameplay.safe.title"],
  ])("labels a %s question with its mode badge on the same panel", (context, titleKey) => {
    renderPanel({ question: question(context) });

    expect(screen.getByText(i18n.t(titleKey))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("studentRace:question.instruction"))).not.toBeInTheDocument();
    expect(surfaceOf("6 × 7 = ?")).toHaveAttribute("data-gameplay", context);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("falls back to the plain instruction for a future context", () => {
    renderPanel({ question: question("FUTURE_CONTEXT") });

    expect(screen.getByText(i18n.t("studentRace:question.instruction"))).toBeInTheDocument();
  });

  it("explains a missed-challenge slowdown in the instruction line", () => {
    renderPanel({ slowdownNotice: true });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:gameplay.slowdownNotice"));
  });

  it("lets answer feedback replace the slowdown notice", () => {
    renderPanel({ slowdownNotice: true, feedbackState: "correct", selectedChoiceId: 1 });

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:question.correctFeedback"));
    expect(screen.queryByText(i18n.t("studentRace:gameplay.slowdownNotice"))).not.toBeInTheDocument();
  });
});

describe("StudentRaceQuestionPanel inline retry", () => {
  it("offers retry while syncing a failed answer", () => {
    const onRetry = vi.fn();
    renderPanel({ feedbackState: "error", onRetry });

    fireEvent.click(screen.getByRole("button", { name: retryName() }));

    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:question.answerSyncing"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("offers retry while waiting for the next question only after an error", () => {
    const { rerender } = renderPanel({ isAwaitingNextQuestion: true, onRetry: vi.fn() });

    expect(screen.queryByRole("button", { name: retryName() })).not.toBeInTheDocument();

    rerender(
      <MantineProvider>
        <StudentRaceQuestionPanel
          question={question()}
          isAwaitingNextQuestion
          error={{ messageKey: "generic" }}
          onRetry={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("button", { name: retryName() })).toBeInTheDocument();
  });

  it("offers retry on an expired question only after an error", () => {
    const { rerender } = renderPanel({ isExpired: true, onRetry: vi.fn() });

    expect(screen.getByText(i18n.t("studentRace:question.timeUp"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: retryName() })).not.toBeInTheDocument();

    rerender(
      <MantineProvider>
        <StudentRaceQuestionPanel question={question()} isExpired error={{ messageKey: "generic" }} onRetry={vi.fn()} />
      </MantineProvider>,
    );

    expect(screen.getByText(i18n.t("studentRace:question.syncError"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: retryName() })).toBeInTheDocument();
  });

  it("renders no retry without a handler", () => {
    renderPanel({ feedbackState: "error" });

    expect(screen.queryByRole("button", { name: retryName() })).not.toBeInTheDocument();
  });
});
