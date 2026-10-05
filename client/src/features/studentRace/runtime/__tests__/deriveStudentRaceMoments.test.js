import { describe, expect, it } from "vitest";

import { STUDENT_RACE_EFFECT } from "../studentRaceRuntimeConstants";
import { deriveStudentRaceMoments } from "../deriveStudentRaceMoments";

function runtime({
  activeEffect = null, targetSpeed = 1, playerFinished = false,
  feedbackEventId = null, feedbackStreak = 0, timeUpQuestionId = null,
} = {}) {
  return { playerFinished, visual: { activeEffect, targetSpeed, feedbackEventId, feedbackStreak, timeUpQuestionId } };
}

function run(...runtimes) {
  const fired = [];
  let previous = null;
  for (const state of runtimes) {
    const { observed, moments } = deriveStudentRaceMoments(previous, state);
    previous = observed;
    fired.push(moments.map(({ type }) => type));
  }
  return fired;
}

describe("deriveStudentRaceMoments", () => {
  it("does not celebrate bootstrap without an accepted answer ID", () => {
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2, playerFinished: true }))).toEqual([[]]);
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2 }))).toEqual([[]]);
  });

  it("treats every one-shot already present on the first observation as a baseline", () => {
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2, feedbackEventId: 41 }))).toEqual([[]]);
    expect(run(runtime({ activeEffect: "wrong", feedbackEventId: 41 }))).toEqual([[]]);
    expect(run(runtime({ playerFinished: true }))).toEqual([[]]);
    expect(run(runtime({ timeUpQuestionId: 7 }))).toEqual([[]]);
  });

  it("keeps a stale accepted answer silent after a reload and plays the next genuine one once", () => {
    expect(run(
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime(),
      runtime({ activeEffect: "correct", feedbackEventId: 42 }),
      runtime({ activeEffect: "correct", feedbackEventId: 42 }),
    )).toEqual([[], [], [], ["correct"], []]);
  });

  it("plays the first genuine answer after a normal baseline", () => {
    expect(run(runtime(), runtime({ activeEffect: "wrong", feedbackEventId: 5 }))).toEqual([[], ["wrong"]]);
  });

  it("ignores null runtime samples without losing the baseline", () => {
    expect(run(runtime({ playerFinished: false }), null, runtime({ playerFinished: true }))).toEqual([
      [],
      [],
      [STUDENT_RACE_EFFECT.FINISH],
    ]);
  });

  it("never infers BOOST from a speed change, which has many causes besides a boost", () => {
    expect(
      run(
        runtime({ targetSpeed: 1 }),
        runtime({ targetSpeed: 1.3 }),
        runtime({ targetSpeed: 2 }),
        runtime({ targetSpeed: 1.1 }),
      ),
    ).toEqual([[], [], [], []]);
  });

  it("uses distinct accepted IDs even when consecutive effects never pass through idle", () => {
    expect(
      run(
        runtime(),
        runtime({ activeEffect: "correct", feedbackEventId: 41 }),
        runtime({ activeEffect: "correct", feedbackEventId: 41 }),
        runtime({ activeEffect: "correct", feedbackEventId: 42 }),
        runtime({ activeEffect: "wrong", feedbackEventId: 43 }),
      ),
    ).toEqual([[], ["correct"], [], ["correct"], ["wrong"]]);
  });

  it("never replays an accepted ID after idle, polls or a newer answer", () => {
    expect(run(
      runtime(),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime(),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime({ activeEffect: "correct", feedbackEventId: 42 }),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
    )).toEqual([[], ["correct"], [], [], ["correct"], []]);
  });

  it("plays only the answer effect when a correct answer also raises the speed", () => {
    expect(run(
      runtime({ targetSpeed: 1 }),
      runtime({ activeEffect: "correct", feedbackEventId: 41, targetSpeed: 1.4 }),
      runtime({ activeEffect: "correct", feedbackEventId: 42, targetSpeed: 1.8 }),
    )).toEqual([[], ["correct"], ["correct"]]);
  });

  it("fires FINISH exactly once on the false → true transition", () => {
    expect(
      run(
        runtime({ playerFinished: false }),
        runtime({ playerFinished: true }),
        runtime({ playerFinished: true }),
      ),
    ).toEqual([[], [STUDENT_RACE_EFFECT.FINISH], []]);
  });

  it("does not fake a finish when the first sample is already finished", () => {
    expect(run(runtime({ playerFinished: true }), runtime({ playerFinished: true }))).toEqual([[], []]);
  });

  it("lets finish suppress answer effects in the same or later samples", () => {
    expect(
      run(
        runtime({ targetSpeed: 1 }),
        runtime({ activeEffect: "correct", feedbackEventId: 41, targetSpeed: 1.4, playerFinished: true }),
        runtime({ activeEffect: "correct", feedbackEventId: 42, targetSpeed: 2, playerFinished: true }),
      ),
    ).toEqual([[], [STUDENT_RACE_EFFECT.FINISH], []]);
  });

  it("does not mutate prior observations when consuming a new accepted ID", () => {
    const first = deriveStudentRaceMoments(null, runtime({ activeEffect: "correct", feedbackEventId: 41 }));
    const second = deriveStudentRaceMoments(first.observed, runtime({ activeEffect: "correct", feedbackEventId: 42 }));

    expect([...first.observed.seenFeedbackEventIds]).toEqual([41]);
    expect([...second.observed.seenFeedbackEventIds]).toEqual([41, 42]);
  });

  it("carries the accepted answer ID and the server streak, so every consumer sees the same moment", () => {
    const baseline = deriveStudentRaceMoments(null, runtime());
    const { moments } = deriveStudentRaceMoments(baseline.observed, runtime({ activeEffect: "correct", feedbackEventId: 41, feedbackStreak: 5 }));
    const wrong = deriveStudentRaceMoments(baseline.observed, runtime({ activeEffect: "wrong", feedbackEventId: 42 }));

    expect(moments).toEqual([{ type: STUDENT_RACE_EFFECT.CORRECT, id: 41, streak: 5 }]);
    expect(wrong.moments).toEqual([{ type: STUDENT_RACE_EFFECT.WRONG, id: 42, streak: 0 }]);
  });

  it("announces TIME_UP once for each question whose time runs out after the first observation", () => {
    expect(run(
      runtime(),
      runtime({ timeUpQuestionId: 7 }),
      runtime({ timeUpQuestionId: 7 }),
      runtime(),
      runtime({ timeUpQuestionId: 7 }),
      runtime({ timeUpQuestionId: 8 }),
    )).toEqual([[], ["time-up"], [], [], [], ["time-up"]]);
  });

  it("treats a question that is already out of time on the first observation as a baseline", () => {
    expect(run(runtime({ timeUpQuestionId: 7 }), runtime({ timeUpQuestionId: 7 }))).toEqual([[], []]);
  });

  it("lets the finish silence a late time-up", () => {
    expect(run(runtime(), runtime({ playerFinished: true, timeUpQuestionId: 9 }))).toEqual([[], ["finish"]]);
  });
});
