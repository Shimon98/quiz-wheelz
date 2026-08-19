import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import i18n from "../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import StudentRaceHud from "./StudentRaceHud";

/*
 * C1-04 HUD contract: runtimeState (server truth) in, presentation out.
 * Assertions target visible values and accessible semantics, never internal
 * structure; expected labels come from the real i18n instance so the tests
 * protect the wiring without duplicating strings.
 */

function buildRuntimeState({
  score = 850,
  streak = 3,
  speed = 1.3,
  position = 420,
  totalDistance = 1000,
} = {}) {
  const state = createInitialRaceRuntimeState();
  state.player = { ...state.player, score, streak, speed, position };
  state.totalDistance = totalDistance;
  return state;
}

const progressLabel = () => i18n.t("studentRace:hud.progressLabel");

describe("StudentRaceHud", () => {
  it("renders score, streak, speed and progress from runtime truth", () => {
    render(<StudentRaceHud runtimeState={buildRuntimeState()} />);

    expect(screen.getByText("850")).toBeInTheDocument();
    expect(screen.getByText("×3")).toBeInTheDocument();
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
    expect(screen.getByText("×4")).toBeInTheDocument();
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
    // Speed is independent server truth and stays visible.
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
});
