import { MantineProvider } from "@mantine/core";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../../../../i18n/i18n";
import { RACE_VIEWS } from "../../../../shared/racePlayer/getRaceView";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import { STUDENT_RACE_FEEDBACK } from "../../runtime/studentRaceRuntimeConstants";
import { resultsFinishOrder, resultsRuntime } from "../../runtime/studentRaceResultsTestFixtures";
import { buildStudentRaceResultsViewModel } from "../../utils/buildStudentRaceResultsViewModel";
import StudentRaceContent from "../StudentRaceContent";

vi.mock("../../pixi/PixiStudentRaceCanvas", () => ({
  default: () => <div data-testid="race-canvas" />,
}));

const HOLD_MS = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;

function runtime(overrides = {}) {
  return { ...createInitialRaceRuntimeState(), ...overrides };
}

function content(props) {
  return (
    <MantineProvider>
      <MemoryRouter>
        <StudentRaceContent
          runtimeState={runtime({ playerFinished: props.view === RACE_VIEWS.FINISHED })}
          isLoading={false}
          error={null}
          retry={() => {}}
          keepRaceScreen={false}
          questionProps={{ feedbackState: STUDENT_RACE_FEEDBACK.IDLE }}
          {...props}
        />
      </MemoryRouter>
    </MantineProvider>
  );
}

const finishedTitle = () => i18n.t("studentRace:status.finishedTitle");
const liveBadge = () => i18n.t("studentRace:results.liveBadge");
const finalBadge = () => i18n.t("studentRace:results.finalBadge");
const watchingModel = () => buildStudentRaceResultsViewModel(resultsRuntime(), resultsFinishOrder([1, 1]));
const finalModel = () =>
  buildStudentRaceResultsViewModel(resultsRuntime({ raceStatus: "FINISHED", raceFinished: true }), null);

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

    rerender(content({ view: RACE_VIEWS.FINISHED, keepRaceScreen: true }));

    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    act(() => vi.advanceTimersByTime(HOLD_MS - 1));
    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    expect(screen.queryByText(finishedTitle())).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    rerender(content({ view: RACE_VIEWS.FINISHED, keepRaceScreen: false }));
    expect(screen.queryByTestId("race-canvas")).not.toBeInTheDocument();
    expect(screen.getByText(finishedTitle())).toBeInTheDocument();
  });

  it("composes with the answer feedback dwell without a remount", () => {
    const { rerender } = render(content({ view: RACE_VIEWS.PLAYING }));
    const canvas = screen.getByTestId("race-canvas");

    rerender(content({ view: RACE_VIEWS.FINISHED, keepRaceScreen: true }));
    act(() => vi.advanceTimersByTime(900));
    rerender(content({ view: RACE_VIEWS.FINISHED, keepRaceScreen: true }));

    expect(screen.getByTestId("race-canvas")).toBe(canvas);
    act(() => vi.advanceTimersByTime(HOLD_MS - 900));
    rerender(content({ view: RACE_VIEWS.FINISHED }));
    expect(screen.getByText(finishedTitle())).toBeInTheDocument();
  });

  it("does not own another finish timer", () => {
    const { rerender, unmount } = render(content({ view: RACE_VIEWS.PLAYING }));
    rerender(content({ view: RACE_VIEWS.FINISHED }));
    expect(vi.getTimerCount()).toBe(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("StudentRaceContent screen selection", () => {
  it("keeps the race screen while playing", () => {
    render(content({ view: RACE_VIEWS.PLAYING, resultsModel: watchingModel() }));

    expect(screen.getByTestId("race-canvas")).toBeInTheDocument();
    expect(screen.queryByText(liveBadge())).not.toBeInTheDocument();
  });

  it("keeps the race screen through the finish ceremony even when results are ready", () => {
    render(content({ view: RACE_VIEWS.FINISHED, keepRaceScreen: true, resultsModel: watchingModel() }));

    expect(screen.getByTestId("race-canvas")).toBeInTheDocument();
    expect(screen.queryByText(liveBadge())).not.toBeInTheDocument();
  });

  it("shows live results on the same route once the ceremony ends while others still race", () => {
    render(content({ view: RACE_VIEWS.FINISHED, resultsModel: watchingModel() }));

    expect(screen.queryByTestId("race-canvas")).not.toBeInTheDocument();
    expect(screen.getByText(liveBadge())).toBeInTheDocument();
    expect(screen.queryByText(finishedTitle())).not.toBeInTheDocument();
  });

  it("shows final results once the race is over", () => {
    render(content({ view: RACE_VIEWS.FINISHED, resultsModel: finalModel() }));

    expect(screen.getByText(finalBadge())).toBeInTheDocument();
    expect(screen.queryByText(finishedTitle())).not.toBeInTheDocument();
  });

  it("keeps the status view for states that have no results", () => {
    render(content({ view: RACE_VIEWS.CANCELLED, resultsModel: null }));

    expect(screen.getByText(i18n.t("studentRace:status.cancelledTitle"))).toBeInTheDocument();
    expect(screen.queryByText(liveBadge())).not.toBeInTheDocument();
  });
});
