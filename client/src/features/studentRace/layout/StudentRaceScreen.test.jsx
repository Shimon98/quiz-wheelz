import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../i18n/i18n";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";
import PixiStudentRaceCanvas from "../pixi/PixiStudentRaceCanvas";
import StudentRaceScreen from "./StudentRaceScreen";

vi.mock("../pixi/PixiStudentRaceCanvas", () => ({
  default: vi.fn(() => <div data-testid="race-canvas" />),
}));

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const ACCEPTED_FEEDBACK = Object.freeze({
  questionId: 17,
  correct: true,
  scoreDelta: 10,
  streak: 3,
});

function emulateReducedMotion(initialValue) {
  const originalMatchMedia = window.matchMedia.bind(window);
  const mediaQuery = Object.assign(new EventTarget(), {
    media: REDUCED_MOTION_QUERY,
    matches: initialValue,
  });
  vi.spyOn(window, "matchMedia").mockImplementation((query) =>
    query === REDUCED_MOTION_QUERY ? mediaQuery : originalMatchMedia(query),
  );
  return (matches) => {
    mediaQuery.matches = matches;
    mediaQuery.dispatchEvent(Object.assign(new Event("change"), { matches }));
  };
}

function runtimeState() {
  const state = createInitialRaceRuntimeState();
  return {
    ...state,
    player: { ...state.player, score: 30, streak: 3, speed: 0.9 },
  };
}

function canvasRuntime() {
  return PixiStudentRaceCanvas.mock.calls.at(-1)[0].runtimeState;
}

function renderRace(runtime, feedback = ACCEPTED_FEEDBACK) {
  return (
    <MantineProvider>
      <StudentRaceScreen
        runtimeState={runtime}
        answerFeedback={feedback}
        feedbackState={feedback ? STUDENT_RACE_FEEDBACK.CORRECT : STUDENT_RACE_FEEDBACK.IDLE}
      />
    </MantineProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("StudentRaceScreen motion preference integration", () => {
  it("passes the initial system preference to Pixi while preserving the written reward and server truth", () => {
    emulateReducedMotion(true);
    const runtime = runtimeState();
    const original = structuredClone(runtime);
    render(renderRace(runtime));

    expect(canvasRuntime().visual).toMatchObject({
      reducedMotion: true,
      feedbackEventId: ACCEPTED_FEEDBACK.questionId,
      feedbackStreak: ACCEPTED_FEEDBACK.streak,
    });
    expect(canvasRuntime().player).toBe(runtime.player);
    expect(runtime).toEqual(original);
    expect(screen.getByRole("status")).toHaveTextContent(i18n.t("studentRace:reward.comboTitle"));
    expect(screen.getByRole("status")).toHaveTextContent("+10");
  });

  it("reacts to a system preference change without replacing the accepted answer identity", () => {
    const changePreference = emulateReducedMotion(false);
    const runtime = runtimeState();
    render(renderRace(runtime));
    expect(canvasRuntime().visual.reducedMotion).toBe(false);

    act(() => changePreference(true));
    expect(canvasRuntime().visual.reducedMotion).toBe(true);
    expect(canvasRuntime().visual.feedbackEventId).toBe(ACCEPTED_FEEDBACK.questionId);
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => changePreference(false));
    expect(canvasRuntime().visual.reducedMotion).toBe(false);
    expect(canvasRuntime().visual.feedbackEventId).toBe(ACCEPTED_FEEDBACK.questionId);
    expect(canvasRuntime().player).toBe(runtime.player);
  });

  it("clears the written reward and event when the answer dwell ends in reduced motion", () => {
    emulateReducedMotion(true);
    const runtime = runtimeState();
    const { rerender } = render(renderRace(runtime));

    rerender(renderRace(runtime, null));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(canvasRuntime().visual).toMatchObject({
      reducedMotion: true,
      feedbackEventId: null,
      activeEffect: null,
    });
    expect(canvasRuntime().player).toBe(runtime.player);
  });
});
