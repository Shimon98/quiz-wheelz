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

  it("explains a server slowdown caused by a failed Turbo", () => {
    const runtimeState = createInitialRaceRuntimeState();
    runtimeState.gameplay = {
      ...runtimeState.gameplay,
      activeEffects: [{
        effectId: 3,
        type: "SPEED_SLOW",
        source: "TURBO_FAILURE",
        magnitudeTenths: 2,
        startsAtEpochMs: 1,
        endsAtEpochMs: 2,
      }],
    };

    render(<StudentRaceOverlay runtimeState={runtimeState} question={buildQuestion()} />);

    expect(screen.getByText(i18n.t("studentRace:gameplay.turboSlowdownNotice"))).toBeInTheDocument();
  });

  it("shows the server's Safe progress on a Safe question", () => {
    const runtimeState = createInitialRaceRuntimeState();
    runtimeState.gameplay = {
      ...runtimeState.gameplay,
      mode: "SAFE_RUN",
      challenge: { energy: 0, threshold: 100, offer: null, lastResult: null,
        run: { challengeId: 4, type: "SAFE_RUN", questionsResolved: 2, totalQuestions: 3, correctAnswers: 2 } },
    };

    render(<StudentRaceOverlay runtimeState={runtimeState} question={{ ...buildQuestion(), gameplayContext: "SAFE_RUN" }} />);

    expect(screen.getByText(i18n.t("studentRace:gameplay.safe.progress", { current: 3, total: 3 }))).toBeInTheDocument();
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

  it("swaps the question for the challenge cards and keeps one timer, the offer countdown", () => {
    const runtimeState = createInitialRaceRuntimeState();
    runtimeState.gameplay = { ...runtimeState.gameplay, mode: "CHALLENGE_CHOICE" };
    const offer = { offerId: 4, expiresAtEpochMs: Date.now() + 9000, serverClockOffsetMs: 0, choices: ["TURBO_TRIAL", "SAFE_RUN"] };

    render(
      <StudentRaceOverlay
        runtimeState={runtimeState}
        question={buildQuestion()}
        interactionEnabled
        challenge={{ visible: true, offer, openChoices: offer.choices, onChoose: () => {} }}
      />,
    );

    expect(screen.queryByText("3 + 4 = ?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("studentRace:gameplay.turbo.title")) })).toBeEnabled();
    expect(screen.queryByLabelText(i18n.t("studentRace:timer.label"))).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(i18n.t("studentRace:timer.challengeLabel"))).toHaveLength(1);
  });

  it("keeps the question panel while the challenge is not visible yet", () => {
    render(
      <StudentRaceOverlay
        runtimeState={createInitialRaceRuntimeState()}
        question={buildQuestion()}
        challenge={{ visible: false, offer: null }}
      />,
    );

    expect(screen.getByText("3 + 4 = ?")).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18n.t("studentRace:timer.label"))).toHaveLength(1);
  });
});
