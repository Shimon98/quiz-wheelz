import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import i18n from "../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import StudentRaceOverlay from "./StudentRaceOverlay";

/*
 * C1-04 architectural regression: the ONE question countdown is
 * StudentRaceQuestionTimer, hosted inside StudentRaceHud — the overlay
 * composition must never grow a second timer.
 */

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
});
