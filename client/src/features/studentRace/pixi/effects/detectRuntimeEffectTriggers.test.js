import { describe, expect, it } from "vitest";

import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { detectRuntimeEffectTriggers } from "./detectRuntimeEffectTriggers";

function runtime({ activeEffect = null, targetSpeed = 1, playerFinished = false } = {}) {
  return { playerFinished, visual: { activeEffect, targetSpeed } };
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
  it("only remembers the first sample", () => {
    expect(run(runtime({ activeEffect: "correct", targetSpeed: 2, playerFinished: true }))).toEqual([[]]);
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

  it("fires an answer effect on each genuine null → effect edge only", () => {
    expect(
      run(
        runtime(),
        runtime({ activeEffect: "correct" }),
        runtime({ activeEffect: "correct" }),
        runtime(),
        runtime({ activeEffect: "correct" }),
        runtime({ activeEffect: "wrong" }),
      ),
    ).toEqual([[], ["correct"], [], [], ["correct"], ["wrong"]]);
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

  it("reports finish before answer and boost effects in one sample", () => {
    expect(
      run(
        runtime({ targetSpeed: 1 }),
        runtime({ activeEffect: "correct", targetSpeed: 1.4, playerFinished: true }),
      )[1],
    ).toEqual([STUDENT_RACE_EFFECT.FINISH, "correct", STUDENT_RACE_EFFECT.BOOST]);
  });
});
