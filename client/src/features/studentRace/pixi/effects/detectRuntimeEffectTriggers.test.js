import { describe, expect, it } from "vitest";

import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { detectRuntimeEffectTriggers } from "./detectRuntimeEffectTriggers";

function runtime({
  activeEffect = null, targetSpeed = 1, playerFinished = false,
  feedbackEventId = null, feedbackStreak = 0,
} = {}) {
  return { playerFinished, visual: { activeEffect, targetSpeed, feedbackEventId, feedbackStreak } };
}

function run(...runtimes) {
  const fired = [];
  let previous = null;
  for (const state of runtimes) {
    const { observed, effects } = detectRuntimeEffectTriggers(previous, state);
    previous = observed;
    fired.push(effects);
  }
  return fired;
}

describe("detectRuntimeEffectTriggers", () => {
  it("does not celebrate bootstrap without an accepted answer ID", () => {
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2, playerFinished: true }))).toEqual([[]]);
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2 }))).toEqual([[]]);
  });

  it("celebrates an accepted answer on the first draw even at capped speed", () => {
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2, feedbackEventId: 41 })))
      .toEqual([[STUDENT_RACE_EFFECT.CORRECT]]);
  });

  it("ignores null runtime samples without losing the baseline", () => {
    expect(run(runtime({ targetSpeed: 1 }), null, runtime({ targetSpeed: 1.3 }))).toEqual([
      [],
      [],
      [STUDENT_RACE_EFFECT.BOOST],
    ]);
  });

  it("boosts once on an authoritative speed increase, never on same or lower speed", () => {
    expect(
      run(
        runtime({ targetSpeed: 1 }),
        runtime({ targetSpeed: 1.3 }),
        runtime({ targetSpeed: 1.3 }),
        runtime({ targetSpeed: 1.1 }),
      ),
    ).toEqual([[], [STUDENT_RACE_EFFECT.BOOST], [], []]);
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
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime(),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
      runtime({ activeEffect: "correct", feedbackEventId: 42 }),
      runtime({ activeEffect: "correct", feedbackEventId: 41 }),
    )).toEqual([["correct"], [], [], ["correct"], []]);
  });

  it("keeps speed-increase BOOST separate from a correct answer", () => {
    expect(run(
      runtime({ targetSpeed: 1 }),
      runtime({ activeEffect: "correct", feedbackEventId: 41, targetSpeed: 1.4 }),
      runtime({ activeEffect: "correct", feedbackEventId: 42, targetSpeed: 1.4 }),
    )).toEqual([[], ["correct", "boost"], ["correct"]]);
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

  it("lets finish suppress answer and boost effects in the same or later samples", () => {
    expect(
      run(
        runtime({ targetSpeed: 1 }),
        runtime({ activeEffect: "correct", feedbackEventId: 41, targetSpeed: 1.4, playerFinished: true }),
        runtime({ activeEffect: "correct", feedbackEventId: 42, targetSpeed: 2, playerFinished: true }),
      ),
    ).toEqual([[], [STUDENT_RACE_EFFECT.FINISH], []]);
  });

  it("does not mutate prior observations when consuming a new accepted ID", () => {
    const first = detectRuntimeEffectTriggers(null, runtime({ activeEffect: "correct", feedbackEventId: 41 }));
    const second = detectRuntimeEffectTriggers(first.observed, runtime({ activeEffect: "correct", feedbackEventId: 42 }));

    expect([...first.observed.seenFeedbackEventIds]).toEqual([41]);
    expect([...second.observed.seenFeedbackEventIds]).toEqual([41, 42]);
  });
});
