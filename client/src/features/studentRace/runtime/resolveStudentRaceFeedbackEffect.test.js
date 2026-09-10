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

  it("uses the accepted answer's identity and streak while preserving newer runtime truth", () => {
    const runtime = createInitialRaceRuntimeState();
    runtime.player.streak = 8;
    runtime.visual.targetSpeed = 1.8;
    const feedback = { questionId: 17, correct: true, scoreDelta: 10, streak: 3 };
    const presentation = applyFeedbackEffectToRuntime(runtime, STUDENT_RACE_FEEDBACK.CORRECT, feedback);

    expect(presentation.visual).toMatchObject({
      activeEffect: STUDENT_RACE_EFFECT.CORRECT,
      feedbackEventId: 17,
      feedbackStreak: 3,
      reducedMotion: false,
      targetSpeed: 1.8,
    });
    expect(presentation.player).toBe(runtime.player);
    expect(runtime.visual.activeEffect).toBeNull();
    expect(runtime.player.streak).toBe(8);
    expect(applyFeedbackEffectToRuntime(presentation, STUDENT_RACE_FEEDBACK.CORRECT, feedback))
      .toBe(presentation);
  });

  it("changes the event identity for consecutive correct answers without requiring an idle render", () => {
    const first = applyFeedbackEffectToRuntime(createInitialRaceRuntimeState(), STUDENT_RACE_FEEDBACK.CORRECT, {
      questionId: 17, correct: true, scoreDelta: 10, streak: 3,
    });
    const second = applyFeedbackEffectToRuntime(first, STUDENT_RACE_FEEDBACK.CORRECT, {
      questionId: 18, correct: true, scoreDelta: 15, streak: 4,
    });

    expect(second.visual.feedbackEventId).toBe(18);
    expect(second.visual.feedbackStreak).toBe(4);
    expect(first.visual.feedbackEventId).toBe(17);
  });

  it("emits no combo for an accepted wrong answer and clears the event when feedback ends", () => {
    const feedback = { questionId: 17, correct: false, scoreDelta: 0, streak: 5 };
    const wrong = applyFeedbackEffectToRuntime(createInitialRaceRuntimeState(), STUDENT_RACE_FEEDBACK.WRONG, feedback);
    expect(wrong.visual.feedbackEventId).toBe(17);
    expect(wrong.visual.feedbackStreak).toBe(0);
    const idle = applyFeedbackEffectToRuntime(wrong, STUDENT_RACE_FEEDBACK.IDLE, feedback);

    expect(idle.visual.activeEffect).toBeNull();
    expect(idle.visual.feedbackEventId).toBeNull();
    expect(idle.visual.feedbackStreak).toBe(0);
  });

  it("suppresses accepted-answer metadata at finish and still forwards reduced motion", () => {
    const feedback = { questionId: 17, correct: true, scoreDelta: 20, streak: 7 };
    const racing = applyFeedbackEffectToRuntime(createInitialRaceRuntimeState(), STUDENT_RACE_FEEDBACK.CORRECT, feedback);
    const finished = { ...racing, playerFinished: true };
    const presentation = applyFeedbackEffectToRuntime(finished, STUDENT_RACE_FEEDBACK.CORRECT, feedback, {
      reducedMotion: true,
    });

    expect(presentation.visual).toMatchObject({
      activeEffect: null, feedbackEventId: null, feedbackStreak: 0, reducedMotion: true,
    });
    expect(presentation.playerFinished).toBe(true);
    expect(presentation.player).toBe(finished.player);
  });

  it("propagates a reduced-motion preference independently from answer effects", () => {
    const runtime = createInitialRaceRuntimeState();
    const presentation = applyFeedbackEffectToRuntime(runtime, STUDENT_RACE_FEEDBACK.IDLE, null, { reducedMotion: true });

    expect(presentation.visual.reducedMotion).toBe(true);
    expect(presentation.visual.activeEffect).toBeNull();
    expect(presentation.visual.feedbackEventId).toBeNull();
    expect(presentation.player).toBe(runtime.player);
    expect(runtime.visual.reducedMotion).toBeUndefined();
  });
});
