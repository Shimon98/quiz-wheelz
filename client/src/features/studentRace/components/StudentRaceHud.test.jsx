import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import i18n from "../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import StudentRaceHud from "./StudentRaceHud";


function buildRuntimeState({
  score = 850,
  streak = 3,
  speed = 1.3,
  position = 420,
  totalDistance = 1000,
  rank = null,
  playerCount = null,
} = {}) {
  const state = createInitialRaceRuntimeState();
  state.player = { ...state.player, score, streak, speed, position, rank };
  state.totalDistance = totalDistance;
  state.playerCount = playerCount;
  return state;
}

const progressLabel = () => i18n.t("studentRace:hud.progressLabel");

describe("StudentRaceHud", () => {
  it("shows server rank and count and removes them when either is unavailable", () => {
    const { rerender } = render(
      <StudentRaceHud runtimeState={buildRuntimeState({ rank: 3, playerCount: 18 })} />,
    );
    expect(screen.getByText("3 / 18")).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:hud.rankValue", { rank: 3, count: 18 })))
      .toBeInTheDocument();

    rerender(<StudentRaceHud runtimeState={buildRuntimeState({ rank: 2, playerCount: null })} />);
    expect(screen.queryByText(i18n.t("studentRace:hud.rankLabel"))).not.toBeInTheDocument();
  });

  it("renders score, streak, speed and progress from runtime truth", () => {
    render(<StudentRaceHud runtimeState={buildRuntimeState()} />);

    expect(screen.getByText("850")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:hud.streakValue", { count: 3 }))).toBeInTheDocument();
    expect(screen.getByText("×1.3")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar", {
      name: progressLabel(),
    });
    expect(progressBar).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("reflects fresh authoritative runtime props with no stale local copy", () => {
    const { rerender } = render(
      <StudentRaceHud runtimeState={buildRuntimeState({ speed: 1.0 })} />,
    );

    rerender(
      <StudentRaceHud
        runtimeState={buildRuntimeState({
          score: 950,
          streak: 4,
          speed: 1.3,
          position: 450,
        })}
      />,
    );

    expect(screen.getByText("950")).toBeInTheDocument();
    expect(screen.queryByText("850")).not.toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: progressLabel() }),
    ).toHaveAttribute("aria-valuenow", "45");
  });

  it("renders no progress when the server has not provided totalDistance", () => {
    render(
      <StudentRaceHud
        runtimeState={buildRuntimeState({ totalDistance: null })}
      />,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("×1.3")).toBeInTheDocument();
  });

  it("caps the drawn progress at 100% for an over-distance position", () => {
    render(<StudentRaceHud runtimeState={buildRuntimeState({ position: 1005 })} />);

    expect(
      screen.getByRole("progressbar", { name: progressLabel() }),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders a high server speed as a plain numeric multiplier", () => {
    render(<StudentRaceHud runtimeState={buildRuntimeState({ speed: 2.0 })} />);

    expect(screen.getByText("×2.0")).toBeInTheDocument();
  });

  it("hosts exactly one question timer — the existing StudentRaceQuestionTimer", () => {
    const question = {
      expiresAtEpochMs: Date.now() + 15000,
      serverClockOffsetMs: 0,
      timeLimitSeconds: 20,
    };

    render(
      <StudentRaceHud runtimeState={buildRuntimeState()} question={question} />,
    );

    expect(
      screen.getAllByLabelText(i18n.t("studentRace:timer.label")),
    ).toHaveLength(1);
  });

  it("renders nothing without runtime truth", () => {
    const { container } = render(<StudentRaceHud runtimeState={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("celebrates the accepted answer snapshot even if a later poll has another streak", () => {
    render(
      <StudentRaceHud
        runtimeState={buildRuntimeState({ streak: 4, speed: 2 })}
        answerFeedback={{ questionId: 7, correct: true, scoreDelta: 20, streak: 3 }}
      />,
    );

    const reward = screen.getByRole("status");
    expect(reward).toHaveTextContent(i18n.t("studentRace:reward.comboTitle"));
    expect(reward).toHaveTextContent(i18n.t("studentRace:reward.streak", { count: 3 }));
    expect(reward).toHaveTextContent("+20");
    expect(screen.getByText("×2.0")).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:hud.streakValue", { count: 4 }))).toBeInTheDocument();
  });

  it("remounts the reward for each accepted answer and clears it after dwell", () => {
    const runtimeState = buildRuntimeState();
    const feedback = { questionId: 7, correct: true, scoreDelta: 10, streak: 2 };
    const { rerender } = render(<StudentRaceHud runtimeState={runtimeState} answerFeedback={feedback} />);
    const firstReward = screen.getByRole("status");

    rerender(<StudentRaceHud runtimeState={runtimeState} answerFeedback={{ ...feedback, questionId: 8, streak: 3 }} />);
    expect(screen.getByRole("status")).not.toBe(firstReward);
    rerender(<StudentRaceHud runtimeState={runtimeState} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each([
    null,
    { questionId: 7, correct: false, scoreDelta: 0, streak: 0 },
  ])("does not infer a reward from a speed or score increase", (answerFeedback) => {
    render(<StudentRaceHud runtimeState={buildRuntimeState({ speed: 2, score: 1000 })} answerFeedback={answerFeedback} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the first correct answer without inventing bonus points", () => {
    render(
      <StudentRaceHud
        runtimeState={buildRuntimeState({ streak: 1 })}
        answerFeedback={{ questionId: 1, correct: true, scoreDelta: 0, streak: 1 }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:reward.correctTitle"));
    expect(screen.queryByText(i18n.t("studentRace:reward.points"))).not.toBeInTheDocument();
  });

  it("lets the finish presentation take precedence over a final correct answer", () => {
    const runtimeState = { ...buildRuntimeState(), playerFinished: true };
    render(
      <StudentRaceHud
        runtimeState={runtimeState}
        answerFeedback={{ questionId: 1, correct: true, scoreDelta: 20, streak: 3 }}
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
