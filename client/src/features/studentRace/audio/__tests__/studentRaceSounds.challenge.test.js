import { afterEach, describe, expect, it, vi } from "vitest";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import { playStudentRaceMoments, soundForMoment } from "../studentRaceSounds";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("student race challenge sounds", () => {
  it.each([
    [STUDENT_RACE_MOMENT.TURBO_SUCCESS, GAME_AUDIO.COMBO_TIER_3],
    [STUDENT_RACE_MOMENT.TURBO_FAILURE, GAME_AUDIO.ANSWER_WRONG],
    [STUDENT_RACE_MOMENT.SAFE_COMPLETE, GAME_AUDIO.COMBO_TIER_1],
    [STUDENT_RACE_MOMENT.SAFE_PERFECT, GAME_AUDIO.COMBO_TIER_2],
  ])("maps the %s result to an existing game sound", (type, key) => {
    expect(soundForMoment({ type })).toBe(key);
  });

  it("lets a challenge result replace the answer sound it arrived with, so one cue plays", () => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});

    playStudentRaceMoments({ id: 1, moments: [
      { type: STUDENT_RACE_MOMENT.CORRECT, id: 7, streak: 4 },
      { type: STUDENT_RACE_MOMENT.TURBO_SUCCESS, id: "challenge-3", challengeId: 3 },
    ] });

    expect(playSfx).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.COMBO_TIER_3);
  });

  it("still plays a result that arrives on its own, and answers without a result as before", () => {
    const playSfx = vi.spyOn(audioEngine, "playSfx").mockImplementation(() => {});

    playStudentRaceMoments({ id: 2, moments: [{ type: STUDENT_RACE_MOMENT.TURBO_FAILURE, id: "challenge-4" }] });
    playStudentRaceMoments({ id: 3, moments: [{ type: STUDENT_RACE_MOMENT.WRONG, id: 8 }] });

    expect(playSfx.mock.calls).toEqual([[GAME_AUDIO.ANSWER_WRONG], [GAME_AUDIO.ANSWER_WRONG]]);
  });
});
