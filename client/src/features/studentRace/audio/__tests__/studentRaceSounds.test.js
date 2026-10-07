import { afterEach, describe, expect, it, vi } from "vitest";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import { engineRateForSpeed, playStudentRaceMoments, soundForMoment } from "../studentRaceSounds";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("student race sounds", () => {
  it("maps each real moment to one game sound", () => {
    expect(soundForMoment({ type: STUDENT_RACE_MOMENT.CORRECT, streak: 1 })).toBe(GAME_AUDIO.ANSWER_CORRECT);
    expect(soundForMoment({ type: STUDENT_RACE_MOMENT.WRONG })).toBe(GAME_AUDIO.ANSWER_WRONG);
    expect(soundForMoment({ type: STUDENT_RACE_MOMENT.TIME_UP })).toBe(GAME_AUDIO.QUESTION_TIME_UP);
    expect(soundForMoment({ type: STUDENT_RACE_MOMENT.FINISH })).toBe(GAME_AUDIO.RACE_FINISH);
    expect(soundForMoment({ type: "boost" })).toBeNull();
    expect(soundForMoment({ type: "constructor" })).toBeNull();
  });

  it("turns a correct answer into the combo sound from the HUD's combo streak, in three tiers", () => {
    const keyFor = (streak) => soundForMoment({ type: STUDENT_RACE_MOMENT.CORRECT, streak });

    expect([0, 1].map(keyFor)).toEqual([GAME_AUDIO.ANSWER_CORRECT, GAME_AUDIO.ANSWER_CORRECT]);
    expect([2, 4].map(keyFor)).toEqual([GAME_AUDIO.COMBO_TIER_1, GAME_AUDIO.COMBO_TIER_1]);
    expect([5, 9].map(keyFor)).toEqual([GAME_AUDIO.COMBO_TIER_2, GAME_AUDIO.COMBO_TIER_2]);
    expect([10, 25].map(keyFor)).toEqual([GAME_AUDIO.COMBO_TIER_3, GAME_AUDIO.COMBO_TIER_3]);
  });

  it("maps the server speed onto a subtle, bounded engine rate", () => {
    expect(engineRateForSpeed(0.5)).toBeCloseTo(0.8);
    expect(engineRateForSpeed(1.25)).toBeCloseTo(1.1);
    expect(engineRateForSpeed(2)).toBeCloseTo(1.4);
    expect(engineRateForSpeed(0)).toBeCloseTo(0.8);
    expect(engineRateForSpeed(9)).toBeCloseTo(1.4);
    expect(engineRateForSpeed(undefined)).toBeCloseTo(0.8);
    expect(engineRateForSpeed(Number.NaN)).toBeCloseTo(0.8);
  });

  it("plays exactly one sound per moment of a batch", () => {
    const play = vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");

    playStudentRaceMoments({
      id: 1,
      moments: [{ type: STUDENT_RACE_MOMENT.CORRECT, id: 41, streak: 5 }, { type: STUDENT_RACE_MOMENT.TIME_UP, id: 42 }],
    });

    expect(play.mock.calls).toEqual([[GAME_AUDIO.COMBO_TIER_2], [GAME_AUDIO.QUESTION_TIME_UP]]);
  });
});
