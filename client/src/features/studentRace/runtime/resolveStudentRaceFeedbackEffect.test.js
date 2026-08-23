import { describe, expect, it } from "vitest";

import { createInitialRaceRuntimeState } from "./createInitialRaceRuntimeState";
import {
  applyFeedbackEffectToRuntime,
  resolveStudentRaceFeedbackEffect,
} from "./resolveStudentRaceFeedbackEffect";
import {
  STUDENT_RACE_EFFECT,
  STUDENT_RACE_FEEDBACK,
} from "./studentRaceRuntimeConstants";

describe("resolveStudentRaceFeedbackEffect", () => {
  it.each([
    [STUDENT_RACE_FEEDBACK.CORRECT, STUDENT_RACE_EFFECT.CORRECT],
    [STUDENT_RACE_FEEDBACK.WRONG, STUDENT_RACE_EFFECT.WRONG],
    [STUDENT_RACE_FEEDBACK.IDLE, null],
    [STUDENT_RACE_FEEDBACK.EXPIRED, null],
    [STUDENT_RACE_FEEDBACK.ERROR, null],
    ["boost", null],
    ["constructor", null],
    [undefined, null],
  ])("maps feedback %s to effect %s", (feedbackState, effect) => {
    expect(resolveStudentRaceFeedbackEffect(feedbackState)).toBe(effect);
  });

  it("sends no answer effect once the player has finished", () => {
    expect(
      resolveStudentRaceFeedbackEffect(STUDENT_RACE_FEEDBACK.CORRECT, {
        playerFinished: true,
      }),
    ).toBeNull();
  });
});

describe("applyFeedbackEffectToRuntime", () => {
  it("returns null runtime untouched", () => {
    expect(
      applyFeedbackEffectToRuntime(null, STUDENT_RACE_FEEDBACK.CORRECT),
    ).toBeNull();
  });

  it("adds the effect to visual without mutating the authoritative runtime", () => {
    const runtime = createInitialRaceRuntimeState();

    const presentation = applyFeedbackEffectToRuntime(
      runtime,
      STUDENT_RACE_FEEDBACK.WRONG,
    );

    expect(presentation.visual.activeEffect).toBe(STUDENT_RACE_EFFECT.WRONG);
    expect(presentation.visual.targetSpeed).toBe(runtime.visual.targetSpeed);
    expect(runtime.visual.activeEffect).toBeNull();
    expect(presentation.player).toBe(runtime.player);
  });

  it("returns the same runtime object when the effect is unchanged", () => {
    const runtime = createInitialRaceRuntimeState();

    expect(
      applyFeedbackEffectToRuntime(runtime, STUDENT_RACE_FEEDBACK.IDLE),
    ).toBe(runtime);
  });

  it("keeps the finished player's runtime free of answer effects", () => {
    const runtime = { ...createInitialRaceRuntimeState(), playerFinished: true };

    expect(
      applyFeedbackEffectToRuntime(runtime, STUDENT_RACE_FEEDBACK.CORRECT),
    ).toBe(runtime);
  });
});
