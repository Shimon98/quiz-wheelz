import { MantineProvider } from "@mantine/core";
import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../../../i18n/i18n";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";
import { createInitialRaceRuntimeState } from "../runtime/createInitialRaceRuntimeState";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";
import StudentRaceContent from "./StudentRaceContent";

vi.mock("../pixi/PixiStudentRaceCanvas", () => ({
  default: () => <div data-testid="race-canvas" />,
}));

const HOLD_MS = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;

function runtime(overrides = {}) {
  return { ...createInitialRaceRuntimeState(), ...overrides };
}

function content(props) {
  return (
    <MantineProvider>
      <StudentRaceContent
        runtimeState={runtime({ playerFinished: props.view === RACE_VIEWS.FINISHED })}
        isLoading={false}
        error={null}
        retry={() => {}}
        showFinishMoment={false}
        questionProps={{ feedbackState: STUDENT_RACE_FEEDBACK.IDLE }}
        {...props}
      />
    </MantineProvider>
  );
}

const finishedTitle = () => i18n.t("studentRace:status.finishedTitle");

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRaceContent finish presentation", () => {
  it("renders the race screen while playing", () => {
    render(content({ view: RACE_VIEWS.PLAYING }));

    expect(screen.getByTestId("race-canvas")).toBeInTheDocument();
  });

  it("shows the final status immediately when already finished on mount", () => {
    render(content({ view: RACE_VIEWS.FINISHED }));

    expect(screen.queryByTestId("race-canvas")).not.toBeInTheDocument();
    expect(screen.getByText(finishedTitle())).toBeInTheDocument();
  });

  it("keeps the same race screen mounted through PLAYING → FINISHED for the finish duration", () => {
    const { rerender } = render(content({ view: RACE_VIEWS.PLAYING }));
    const canvas = screen.getByTestId("race-canvas");

    rerender(content({ view: RACE_VIEWS.FINISHED }));

    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    act(() => vi.advanceTimersByTime(HOLD_MS - 1));
    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    expect(screen.queryByText(finishedTitle())).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("race-canvas")).not.toBeInTheDocument();
    expect(screen.getByText(finishedTitle())).toBeInTheDocument();
  });

  it("composes with the answer feedback dwell without a remount", () => {
    const { rerender } = render(content({ view: RACE_VIEWS.PLAYING }));
    const canvas = screen.getByTestId("race-canvas");

    rerender(content({ view: RACE_VIEWS.FINISHED, showFinishMoment: true }));
    act(() => vi.advanceTimersByTime(900));
    rerender(content({ view: RACE_VIEWS.FINISHED, showFinishMoment: false }));

    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    act(() => vi.advanceTimersByTime(HOLD_MS - 900));
    expect(screen.getByText(finishedTitle())).toBeInTheDocument();
  });

  it("clears the hold timer on unmount", () => {
    const { rerender, unmount } = render(content({ view: RACE_VIEWS.PLAYING }));
    rerender(content({ view: RACE_VIEWS.FINISHED }));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
