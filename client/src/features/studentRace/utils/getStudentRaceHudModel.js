import { resolveRacePlacement } from "../../../shared/components/raceRank/racePlacementConfig";
import { getRaceProgressRatio } from "./getRaceProgressRatio";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { RACE_GAMEPLAY_MODES } from "../../../constants/raceGameplayConstants";

function getRewardModel(feedback, playerFinished, formatter) {
  if (playerFinished || feedback?.correct !== true || feedback.questionId == null) return null;
  const streak = Number.isSafeInteger(feedback.streak) && feedback.streak >= 0
    ? feedback.streak
    : 0;
  const isCombo = streak >= STUDENT_RACE_CONFIG.comboMinStreak;
  return {
    id: feedback.questionId,
    kind: isCombo ? "combo" : "correct",
    titleKey: isCombo ? "reward.comboTitle" : "reward.correctTitle",
    streak,
    pointsText: Number.isSafeInteger(feedback.scoreDelta) && feedback.scoreDelta !== 0
      ? formatter.format(feedback.scoreDelta)
      : null,
  };
}

function hasSharedRank(player, playerCount, opponents) {
  if (!Array.isArray(opponents) || opponents.length + 1 !== playerCount) return false;
  return opponents.some((opponent) => opponent?.rank === player.rank);
}

function getEnergyModel(gameplay, formatter) {
  const challenge = gameplay?.challenge;
  if (gameplay?.mode !== RACE_GAMEPLAY_MODES.NORMAL || challenge == null) return null;
  const value = Math.min(challenge.energy, challenge.threshold);
  return {
    value,
    max: challenge.threshold,
    full: value === challenge.threshold,
    text: `${formatter.format(value)}/${formatter.format(challenge.threshold)}`,
    style: { width: `${(value / challenge.threshold) * 100}%` },
  };
}

export function getStudentRaceHudModel(runtimeState, language = "he", answerFeedback = null) {
  if (runtimeState?.player == null) return null;

  const { player, totalDistance, playerCount, opponents } = runtimeState;
  const progressRatio = getRaceProgressRatio(player.position, totalDistance);
  const progressPercent = progressRatio == null ? null : Math.round(progressRatio * 100);
  const hasStanding = Number.isSafeInteger(player.rank) && player.rank > 0
    && Number.isSafeInteger(playerCount) && playerCount >= player.rank;
  const sharedRank = hasStanding && hasSharedRank(player, playerCount, opponents);
  const isCombo = Number.isSafeInteger(player.streak) && player.streak >= STUDENT_RACE_CONFIG.comboMinStreak;
  const reward = getRewardModel(
    answerFeedback,
    runtimeState.playerFinished === true,
    new Intl.NumberFormat(language, { signDisplay: "always" }),
  );

  return {
    scoreText: new Intl.NumberFormat(language).format(player.score),
    rank: hasStanding ? player.rank : null,
    playerCount: hasStanding ? playerCount : null,
    rankText: hasStanding ? `${player.rank} / ${playerCount}` : null,
    rankArt: resolveRacePlacement(player.rank, hasStanding).art,
    sharedRank,
    rankLabelKey: sharedRank ? "hud.sharedRankLabel" : "hud.rankLabel",
    rankValueKey: sharedRank ? "hud.sharedRankValue" : "hud.rankValue",
    streak: player.streak,
    streakText: new Intl.NumberFormat(language).format(player.streak),
    streakLabelKey: isCombo ? "hud.comboLabel" : "hud.streakShortLabel",
    isCombo,
    speed: runtimeState.visual.targetSpeed,
    reward,
    rewardKey: reward?.id ?? "steady",
    style: { "--race-reward-duration": `${STUDENT_RACE_CONFIG.feedbackDelayMs}ms` },
    progressPercent,
    progressText: progressPercent == null ? null : `${progressPercent}%`,
    progressStyle: { width: `${progressPercent ?? 0}%` },
    energy: getEnergyModel(runtimeState.gameplay, new Intl.NumberFormat(language)),
  };
}
