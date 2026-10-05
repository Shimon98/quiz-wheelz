import { audioEngine } from "../../../shared/audio";
import { GAME_AUDIO } from "../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { STUDENT_RACE_MOMENT } from "../runtime/studentRaceRuntimeConstants";

export const STUDENT_RACE_SOUND = Object.freeze({
  raceMusicGain: 0.6,
  engineRate: Object.freeze({ minSpeed: 0.5, maxSpeed: 2, minRate: 0.8, maxRate: 1.4 }),
  preloadKeys: Object.freeze([
    GAME_AUDIO.ANSWER_CORRECT,
    GAME_AUDIO.ANSWER_WRONG,
    GAME_AUDIO.COMBO_TIER_1,
    GAME_AUDIO.COMBO_TIER_2,
    GAME_AUDIO.COMBO_TIER_3,
    GAME_AUDIO.QUESTION_TIME_UP,
    GAME_AUDIO.RACE_FINISH,
    GAME_AUDIO.HOVER_ENGINE,
  ]),
});

const COMBO_TIERS = Object.freeze([
  { minStreak: 10, key: GAME_AUDIO.COMBO_TIER_3 },
  { minStreak: 5, key: GAME_AUDIO.COMBO_TIER_2 },
  { minStreak: STUDENT_RACE_CONFIG.comboMinStreak, key: GAME_AUDIO.COMBO_TIER_1 },
]);

const MOMENT_SOUNDS = Object.freeze({
  [STUDENT_RACE_MOMENT.WRONG]: GAME_AUDIO.ANSWER_WRONG,
  [STUDENT_RACE_MOMENT.TIME_UP]: GAME_AUDIO.QUESTION_TIME_UP,
  [STUDENT_RACE_MOMENT.FINISH]: GAME_AUDIO.RACE_FINISH,
});

export function soundForMoment({ type, streak = 0 }) {
  if (type === STUDENT_RACE_MOMENT.CORRECT) {
    return COMBO_TIERS.find(({ minStreak }) => streak >= minStreak)?.key ?? GAME_AUDIO.ANSWER_CORRECT;
  }
  return Object.hasOwn(MOMENT_SOUNDS, type) ? MOMENT_SOUNDS[type] : null;
}

export function engineRateForSpeed(speed) {
  const { minSpeed, maxSpeed, minRate, maxRate } = STUDENT_RACE_SOUND.engineRate;
  if (!Number.isFinite(speed)) return minRate;
  const progress = (Math.min(Math.max(speed, minSpeed), maxSpeed) - minSpeed) / (maxSpeed - minSpeed);
  return minRate + progress * (maxRate - minRate);
}

export function playStudentRaceMoments(batch) {
  batch.moments.forEach((moment) => {
    const key = soundForMoment(moment);
    if (key != null) audioEngine.playSfx(key);
  });
}
