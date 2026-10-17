import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { normalizeApiError } from "../../../../errors/normalizeApiError";
import useStudentRaceRecoverySync from "../useStudentRaceRecoverySync";

function serverError(status, errorName) {
  return normalizeApiError({ response: { status, data: { error: errorName } } });
}

function renderRecovery(overrides = {}) {
  const actions = {
    stopPresence: vi.fn(),
    reconnectNow: vi.fn(),
    raceRetry: vi.fn(),
    authoritativeResync: vi.fn(),
  };
  const baseProps = {
    view: "PLAYING",
    raceError: null,
    questionError: null,
    answerError: null,
    challengeError: null,
    resyncToken: 0,
    ...actions,
  };
  const hook = renderHook((props) => useStudentRaceRecoverySync(props), {
    initialProps: { ...baseProps, ...overrides },
  });
  return { ...hook, actions, baseProps };
}

describe("useStudentRaceRecoverySync challenge recovery", () => {
  it("answers a question refused for an open challenge with fresh race truth, once per error", () => {
    const required = serverError(409, "CHALLENGE_CHOICE_REQUIRED");
    const { actions, rerender, baseProps } = renderRecovery({ questionError: required });

    rerender({ ...baseProps, questionError: required });

    expect(actions.raceRetry).toHaveBeenCalledTimes(1);
  });

  it("leaves a failed choice to the challenge hook's own check and still recovers a later answer failure", () => {
    const choiceFailure = serverError(409, "CHALLENGE_OFFER_EXPIRED");
    const { actions, rerender, baseProps } = renderRecovery({ challengeError: choiceFailure });

    expect(actions.raceRetry).not.toHaveBeenCalled();

    rerender({ ...baseProps, challengeError: choiceFailure, answerError: serverError(500, null) });

    expect(actions.raceRetry).toHaveBeenCalledTimes(1);
  });

  it("reconnects for a choice that needs a reconnect and leaves session loss to the gate", () => {
    const { actions, rerender, baseProps } = renderRecovery({
      challengeError: serverError(409, "RACE_PLAYER_RECONNECT_REQUIRED"),
    });

    expect(actions.reconnectNow).toHaveBeenCalledTimes(1);
    expect(actions.raceRetry).not.toHaveBeenCalled();

    rerender({ ...baseProps, challengeError: serverError(401, "RACE_PLAYER_NOT_FOUND") });

    expect(actions.raceRetry).not.toHaveBeenCalled();
  });
});
