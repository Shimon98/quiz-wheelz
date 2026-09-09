import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../../../i18n/i18n";
import StudentRaceQuestionTimer from "./StudentRaceQuestionTimer";

const NOW = 1_800_000_000_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRaceQuestionTimer", () => {
  it("formats the calibrated server deadline as a stopwatch and catches up after clock jumps", () => {
    const { unmount } = render(
      <StudentRaceQuestionTimer
        expiresAtEpochMs={NOW + 67000}
        serverClockOffsetMs={2000}
        timeLimitSeconds={90}
      />,
    );

    expect(screen.getByText("1:05")).toBeInTheDocument();
    act(() => {
      vi.setSystemTime(NOW + 62000);
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText("0:03")).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:timer.label")))
      .toHaveAttribute("data-urgency", "danger");

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("0:00")).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a fresh question deadline without starting a second timer", () => {
    const { rerender, unmount } = render(
      <StudentRaceQuestionTimer
        expiresAtEpochMs={NOW + 8000}
        serverClockOffsetMs={0}
        timeLimitSeconds={20}
      />,
    );
    expect(screen.getByText("0:08")).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:timer.label")))
      .toHaveAttribute("data-urgency", "warning");

    vi.setSystemTime(NOW + 125);
    rerender(
      <StudentRaceQuestionTimer
        expiresAtEpochMs={NOW + 20125}
        serverClockOffsetMs={0}
        timeLimitSeconds={20}
      />,
    );

    expect(screen.getByText("0:20")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
