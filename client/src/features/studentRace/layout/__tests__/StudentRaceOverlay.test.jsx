import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import i18n from "../../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import StudentRaceOverlay from "../StudentRaceOverlay";

function buildQuestion() {
  return {
    id: 1,
    text: "3 + 4 = ?",
    timeLimitSeconds: 20,
    expiresAtEpochMs: Date.now() + 15000,
    serverClockOffsetMs: 0,
    choices: [
      { id: 1, text: "5" },
      { id: 2, text: "6" },
      { id: 3, text: "7" },
      { id: 4, text: "8" },
    ],
  };
}

describe("StudentRaceOverlay", () => {
  it("locks answers and shows the connection notice while degraded (C1-05)", () => {
    render(
      <StudentRaceOverlay
        runtimeState={createInitialRaceRuntimeState()}
        question={buildQuestion()}
        connectionState="RECONNECTING"
        interactionEnabled={false}
        onChoiceSelect={() => {}}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      i18n.t("studentRace:connection.reconnectingTitle"),
    );
    for (const choice of ["5", "6", "7", "8"]) {
      expect(screen.getByRole("button", { name: choice })).toBeDisabled();
    }
  });

  it("contains exactly one question timer across the whole overlay", () => {
    render(
      <StudentRaceOverlay
        runtimeState={createInitialRaceRuntimeState()}
        question={buildQuestion()}
      />,
    );

    expect(
      screen.getAllByLabelText(i18n.t("studentRace:timer.label")),
    ).toHaveLength(1);
  });

  it("explains a server slowdown caused by a missed challenge", () => {
    const runtimeState = createInitialRaceRuntimeState();
    runtimeState.gameplay = {
      ...runtimeState.gameplay,
      activeEffects: [{
        effectId: 1,
        type: "SPEED_SLOW",
        source: "CHALLENGE_TIMEOUT",
        magnitudeTenths: 3,
        startsAtEpochMs: 1,
        endsAtEpochMs: 2,
      }],
    };

    render(<StudentRaceOverlay runtimeState={runtimeState} question={buildQuestion()} />);

    expect(screen.getByText(i18n.t("studentRace:gameplay.slowdownNotice"))).toBeInTheDocument();
  });

  it("does not explain a slowdown from another source", () => {
    const runtimeState = createInitialRaceRuntimeState();
    runtimeState.gameplay = {
      ...runtimeState.gameplay,
      activeEffects: [{
        effectId: 2,
        type: "SPEED_SLOW",
        source: "POWER_UP",
        magnitudeTenths: 3,
        startsAtEpochMs: 1,
        endsAtEpochMs: 2,
      }],
    };

    render(<StudentRaceOverlay runtimeState={runtimeState} question={buildQuestion()} />);

    expect(screen.queryByText(i18n.t("studentRace:gameplay.slowdownNotice"))).not.toBeInTheDocument();
    expect(screen.getByText(i18n.t("studentRace:question.instruction"))).toBeInTheDocument();
  });
});
