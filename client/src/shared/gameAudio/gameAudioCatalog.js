import { AUDIO_KINDS } from "../audio";
import bambooBlitzUrl from "../../assets/audio/music/bamboo-blitz.m4a";
import joyfulJungleUrl from "../../assets/audio/music/joyful-jungle.m4a";
import answerCorrectUrl from "../../assets/audio/sfx/answer-correct.wav";
import answerWrongUrl from "../../assets/audio/sfx/answer-wrong.wav";
import comboTier1Url from "../../assets/audio/sfx/combo-tier-1.wav";
import comboTier2Url from "../../assets/audio/sfx/combo-tier-2.wav";
import comboTier3Url from "../../assets/audio/sfx/combo-tier-3.wav";
import questionTimeUpUrl from "../../assets/audio/sfx/question-time-up.wav";
import raceStartUrl from "../../assets/audio/sfx/race-start.wav";
import raceFinishUrl from "../../assets/audio/sfx/race-finish.wav";
import challengeOfferUrl from "../../assets/audio/sfx/challenge-offer.wav";
import turboArmUrl from "../../assets/audio/sfx/turbo-arm.wav";
import turboLaunchUrl from "../../assets/audio/sfx/turbo-launch.wav";
import turboFizzleUrl from "../../assets/audio/sfx/turbo-fizzle.wav";
import safePerfectUrl from "../../assets/audio/sfx/safe-perfect.wav";
import projectorPlayerJoinedUrl from "../../assets/audio/sfx/projector-player-joined.wav";
import projectorRaceStartUrl from "../../assets/audio/sfx/projector-race-start.wav";
import projectorPlayerFinishedUrl from "../../assets/audio/sfx/projector-player-finished.wav";
import projectorRaceFinishedUrl from "../../assets/audio/sfx/projector-race-finished.wav";
import hoverEngineUrl from "../../assets/audio/loops/hover-engine.wav";

export const GAME_AUDIO = Object.freeze({
  MUSIC_GAME: "music-game-main",
  MUSIC_RACE: "music-race-main",
  ANSWER_CORRECT: "sfx-answer-correct",
  ANSWER_WRONG: "sfx-answer-wrong",
  COMBO_TIER_1: "sfx-combo-tier-1",
  COMBO_TIER_2: "sfx-combo-tier-2",
  COMBO_TIER_3: "sfx-combo-tier-3",
  QUESTION_TIME_UP: "sfx-question-time-up",
  RACE_START: "sfx-race-start",
  RACE_FINISH: "sfx-race-finish",
  CHALLENGE_OFFER: "sfx-challenge-offer",
  TURBO_ARM: "sfx-turbo-arm",
  TURBO_LAUNCH: "sfx-turbo-launch",
  TURBO_FIZZLE: "sfx-turbo-fizzle",
  SAFE_PERFECT: "sfx-safe-perfect",
  HOVER_ENGINE: "loop-hover-engine",
  PROJECTOR_PLAYER_JOINED: "sfx-projector-player-joined",
  PROJECTOR_RACE_START: "sfx-projector-race-start",
  PROJECTOR_PLAYER_FINISHED: "sfx-projector-player-finished",
  PROJECTOR_RACE_FINISHED: "sfx-projector-race-finished",
});

export const GAME_AUDIO_MANIFEST = Object.freeze([
  { key: GAME_AUDIO.MUSIC_GAME, kind: AUDIO_KINDS.MUSIC, url: bambooBlitzUrl, gain: 0.55 },
  { key: GAME_AUDIO.MUSIC_RACE, kind: AUDIO_KINDS.MUSIC, url: joyfulJungleUrl, gain: 0.55 },
  { key: GAME_AUDIO.ANSWER_CORRECT, kind: AUDIO_KINDS.SFX, url: answerCorrectUrl, gain: 0.6, maxVoices: 2 },
  { key: GAME_AUDIO.ANSWER_WRONG, kind: AUDIO_KINDS.SFX, url: answerWrongUrl, gain: 0.45, maxVoices: 2 },
  { key: GAME_AUDIO.COMBO_TIER_1, kind: AUDIO_KINDS.SFX, url: comboTier1Url, gain: 0.6, maxVoices: 1 },
  { key: GAME_AUDIO.COMBO_TIER_2, kind: AUDIO_KINDS.SFX, url: comboTier2Url, gain: 0.6, maxVoices: 1 },
  { key: GAME_AUDIO.COMBO_TIER_3, kind: AUDIO_KINDS.SFX, url: comboTier3Url, gain: 0.6, maxVoices: 1 },
  { key: GAME_AUDIO.QUESTION_TIME_UP, kind: AUDIO_KINDS.SFX, url: questionTimeUpUrl, gain: 0.45, maxVoices: 1 },
  { key: GAME_AUDIO.RACE_START, kind: AUDIO_KINDS.SFX, url: raceStartUrl, gain: 0.5, maxVoices: 1, cooldownMs: 1500 },
  { key: GAME_AUDIO.RACE_FINISH, kind: AUDIO_KINDS.SFX, url: raceFinishUrl, gain: 0.75, maxVoices: 1, cooldownMs: 1500 },
  { key: GAME_AUDIO.CHALLENGE_OFFER, kind: AUDIO_KINDS.SFX, url: challengeOfferUrl, gain: 0.6, maxVoices: 1, cooldownMs: 1000 },
  { key: GAME_AUDIO.TURBO_ARM, kind: AUDIO_KINDS.SFX, url: turboArmUrl, gain: 0.55, maxVoices: 1, cooldownMs: 1000 },
  // Approved at full level in the Sound Lab; every catalog gain stays under 1.
  { key: GAME_AUDIO.TURBO_LAUNCH, kind: AUDIO_KINDS.SFX, url: turboLaunchUrl, gain: 0.95, maxVoices: 1, cooldownMs: 1000 },
  { key: GAME_AUDIO.TURBO_FIZZLE, kind: AUDIO_KINDS.SFX, url: turboFizzleUrl, gain: 0.55, maxVoices: 1, cooldownMs: 1000 },
  { key: GAME_AUDIO.SAFE_PERFECT, kind: AUDIO_KINDS.SFX, url: safePerfectUrl, gain: 0.6, maxVoices: 1, cooldownMs: 1000 },
  { key: GAME_AUDIO.HOVER_ENGINE, kind: AUDIO_KINDS.LOOP, url: hoverEngineUrl, gain: 0.22 },
  { key: GAME_AUDIO.PROJECTOR_PLAYER_JOINED, kind: AUDIO_KINDS.SFX, url: projectorPlayerJoinedUrl, gain: 0.3, maxVoices: 1, cooldownMs: 1000 },
  { key: GAME_AUDIO.PROJECTOR_RACE_START, kind: AUDIO_KINDS.SFX, url: projectorRaceStartUrl, gain: 0.45, maxVoices: 1, cooldownMs: 1500 },
  { key: GAME_AUDIO.PROJECTOR_PLAYER_FINISHED, kind: AUDIO_KINDS.SFX, url: projectorPlayerFinishedUrl, gain: 0.35, maxVoices: 1, cooldownMs: 400 },
  { key: GAME_AUDIO.PROJECTOR_RACE_FINISHED, kind: AUDIO_KINDS.SFX, url: projectorRaceFinishedUrl, gain: 0.6, maxVoices: 1, cooldownMs: 1500 },
]);
