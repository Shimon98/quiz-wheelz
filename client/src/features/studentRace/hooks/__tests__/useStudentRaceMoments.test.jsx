import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import useStudentRaceMoments from "../useStudentRaceMoments";

function runtime({ activeEffect = null, feedbackEventId = null, feedbackStreak = 0, playerFinished = false, targetSpeed = 1 } = {}) {
  return { playerFinished, visual: { activeEffect, feedbackEventId, feedbackStreak, targetSpeed } };
}

function Owner({ presentation, consumers }) {
  useStudentRaceMoments(presentation, consumers);
  return null;
}

describe("useStudentRaceMoments", () => {
  it("hands the renderer and the sound adapter the very same batch, once per accepted answer", () => {
    const renderer = vi.fn();
    const sound = vi.fn();
    const consumers = [renderer, sound];
    const { rerender } = render(<Owner presentation={runtime()} consumers={consumers} />);

    const answered = runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 3 });
    rerender(<Owner presentation={answered} consumers={consumers} />);
    rerender(<Owner presentation={{ ...answered }} consumers={consumers} />);

    expect(renderer).toHaveBeenCalledTimes(1);
    expect(sound).toHaveBeenCalledTimes(1);
    const [batch] = renderer.mock.calls[0];
    expect(sound.mock.calls[0][0]).toBe(batch);
    expect(Object.isFrozen(batch)).toBe(true);
    expect(batch.moments).toEqual([{ type: STUDENT_RACE_MOMENT.CORRECT, id: 41, streak: 3 }]);
  });

  it("numbers batches and plays a new answer ID, a wrong answer and the finish once each", () => {
    const consumer = vi.fn();
    const consumers = [consumer];
    const { rerender } = render(<Owner presentation={runtime()} consumers={consumers} />);

    rerender(<Owner presentation={runtime({ activeEffect: "correct", feedbackEventId: 41 })} consumers={consumers} />);
    rerender(<Owner presentation={runtime({ activeEffect: "wrong", feedbackEventId: 42 })} consumers={consumers} />);
    rerender(<Owner presentation={runtime({ playerFinished: true })} consumers={consumers} />);
    rerender(<Owner presentation={runtime({ playerFinished: true, targetSpeed: 2 })} consumers={consumers} />);

    expect(consumer.mock.calls.map(([batch]) => [batch.id, batch.moments.map(({ type }) => type)])).toEqual([
      [1, ["correct"]],
      [2, ["wrong"]],
      [3, ["finish"]],
    ]);
  });

  it("starts from a baseline: a finished first observation and a speed rise announce nothing", () => {
    const consumer = vi.fn();
    const consumers = [consumer];
    const { rerender } = render(<Owner presentation={runtime({ playerFinished: true })} consumers={consumers} />);

    rerender(<Owner presentation={runtime({ playerFinished: true, targetSpeed: 1.8 })} consumers={consumers} />);
    const racing = render(<Owner presentation={runtime({ targetSpeed: 1 })} consumers={consumers} />);
    racing.rerender(<Owner presentation={runtime({ targetSpeed: 1.6 })} consumers={consumers} />);

    expect(consumer).not.toHaveBeenCalled();
  });

  it("establishes the baseline through StrictMode's double effects, then delivers a fresh answer exactly once", () => {
    const consumer = vi.fn();
    const consumers = [consumer];
    const { rerender } = render(
      <StrictMode>
        <Owner presentation={runtime()} consumers={consumers} />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <Owner presentation={runtime({ activeEffect: "correct", feedbackEventId: 41 })} consumers={consumers} />
      </StrictMode>,
    );

    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it("replays nothing when the owner remounts while accepted feedback is still present", () => {
    const consumer = vi.fn();
    const present = runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 3 });

    const { unmount } = render(<Owner presentation={present} consumers={[consumer]} />);
    unmount();
    render(<Owner presentation={present} consumers={[consumer]} />);

    expect(consumer).not.toHaveBeenCalled();
  });

  it("keeps delivering to the other consumers when one of them fails", () => {
    const broken = vi.fn(() => {
      throw new Error("audio device lost");
    });
    const renderer = vi.fn();
    const consumers = [broken, renderer];
    const { rerender } = render(<Owner presentation={runtime()} consumers={consumers} />);

    rerender(<Owner presentation={runtime({ activeEffect: "wrong", feedbackEventId: 7 })} consumers={consumers} />);

    expect(broken).toHaveBeenCalledTimes(1);
    expect(renderer).toHaveBeenCalledTimes(1);
  });
});
