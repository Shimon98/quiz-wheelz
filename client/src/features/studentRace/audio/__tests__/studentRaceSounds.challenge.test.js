import { afterEach, describe, expect, it, vi } from "vitest";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { deriveStudentRaceMoments } from "../../runtime/deriveStudentRaceMoments";
import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import { playStudentRaceMoments, soundForMoment, STUDENT_RACE_SOUND } from "../studentRaceSounds";

afterEach(() => {
  vi.restoreAllMocks();
});

function sample({ offer = null, run = null, lastResult = null, playerFinished = false, activeEffect = null, feedbackEventId = null } = {}) {
  return {
    race: { id: 7 },
    player: { racePlayerId: 1 },
    playerFinished,
    visual: { activeEffect, feedbackEventId, feedbackStreak: 0, timeUpQuestionId: null },
    gameplay: { mode: "NORMAL", challenge: { energy: 0, threshold: 100, offer, run, lastResult } },
  };
}
const offerOf = (offerId) => ({ offerId, expiresAtEpochMs: 1, serverClockOffsetMs: 0, choices: ["TURBO_TRIAL", "SAFE_RUN"] });
const turboRun = (challengeId) => ({ challengeId, type: "TURBO_TRIAL", questionsResolved: 0, totalQuestions: 1, correctAnswers: 0 });
const resultOf = (challengeId, outcome, type) => ({ challengeId, type, outcome, questionsResolved: 1, correctAnswers: 1, completedAtEpochMs: 1 });

describe("student race challenge sounds when several moments share one sample", () => {
  it.each([
    ["a new Turbo run and a Turbo result", { run: turboRun(6), lastResult: resultOf(5, "TURBO_SUCCESS", "TURBO_TRIAL") }, GAME_AUDIO.TURBO_LAUNCH],
    ["a new offer and a Safe result", { offer: offerOf(7), lastResult: resultOf(6, "SAFE_PERFECT", "SAFE_RUN") }, GAME_AUDIO.SAFE_PERFECT],
    ["a new offer and the correct answer that filled the meter", { offer: offerOf(8), activeEffect: "correct", feedbackEventId: 80 }, GAME_AUDIO.CHALLENGE_OFFER],
    ["the finish with an offer, a run and a result", { offer: offerOf(9), run: turboRun(9), lastResult: resultOf(8, "TURBO_FAILURE", "TURBO_TRIAL"),
      playerFinished: true }, GAME_AUDIO.RACE_FINISH],
  ])("plays one cue for %s", (label, next, key) => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});
    const { observed } = deriveStudentRaceMoments(null, sample());
    const { moments } = deriveStudentRaceMoments(observed, sample(next));

    playStudentRaceMoments({ id: 9, moments });

    expect(playSfx).toHaveBeenCalledExactlyOnceWith(key);
  });
});

describe("student race challenge sounds", () => {
  it.each([
    [STUDENT_RACE_MOMENT.CHALLENGE_OFFER, GAME_AUDIO.CHALLENGE_OFFER],
    [STUDENT_RACE_MOMENT.TURBO_ARMED, GAME_AUDIO.TURBO_ARM],
    [STUDENT_RACE_MOMENT.TURBO_SUCCESS, GAME_AUDIO.TURBO_LAUNCH],
    [STUDENT_RACE_MOMENT.TURBO_FAILURE, GAME_AUDIO.TURBO_FIZZLE],
    [STUDENT_RACE_MOMENT.SAFE_COMPLETE, GAME_AUDIO.COMBO_TIER_1],
    [STUDENT_RACE_MOMENT.SAFE_PERFECT, GAME_AUDIO.SAFE_PERFECT],
  ])("maps the %s moment to its approved sound", (type, key) => {
    expect(soundForMoment({ type })).toBe(key);
  });

  it("preloads every challenge cue, so its first play is not dropped", () => {
    expect(STUDENT_RACE_SOUND.preloadKeys).toEqual(expect.arrayContaining([GAME_AUDIO.CHALLENGE_OFFER,
      GAME_AUDIO.TURBO_ARM, GAME_AUDIO.TURBO_LAUNCH, GAME_AUDIO.TURBO_FIZZLE, GAME_AUDIO.SAFE_PERFECT]));
  });

  it("lets a challenge result replace the answer sound it arrived with, so one cue plays", () => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});

    playStudentRaceMoments({ id: 1, moments: [
      { type: STUDENT_RACE_MOMENT.CORRECT, id: 7, streak: 4 },
      { type: STUDENT_RACE_MOMENT.TURBO_SUCCESS, id: "challenge-3", challengeId: 3 },
    ] });

    expect(playSfx).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.TURBO_LAUNCH);
  });

  it("lets a new offer replace the sound of the correct answer that filled the meter", () => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});

    playStudentRaceMoments({ id: 4, moments: [
      { type: STUDENT_RACE_MOMENT.CORRECT, id: 9, streak: 4 },
      { type: STUDENT_RACE_MOMENT.CHALLENGE_OFFER, id: "offer-5", offerId: 5 },
    ] });

    expect(playSfx).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.CHALLENGE_OFFER);
  });

  it("still plays results and the Turbo arm that arrive on their own, and answers without them as before", () => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});

    playStudentRaceMoments({ id: 2, moments: [{ type: STUDENT_RACE_MOMENT.TURBO_FAILURE, id: "challenge-4" }] });
    playStudentRaceMoments({ id: 3, moments: [{ type: STUDENT_RACE_MOMENT.TURBO_ARMED, id: "turbo-armed-5", challengeId: 5 }] });
    playStudentRaceMoments({ id: 5, moments: [{ type: STUDENT_RACE_MOMENT.WRONG, id: 8 }] });

    expect(playSfx.mock.calls).toEqual([[GAME_AUDIO.TURBO_FIZZLE], [GAME_AUDIO.TURBO_ARM], [GAME_AUDIO.ANSWER_WRONG]]);
  });
});
