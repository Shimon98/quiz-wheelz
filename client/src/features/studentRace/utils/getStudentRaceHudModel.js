import { getRaceProgressRatio } from "./getRaceProgressRatio";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";

function getRewardModel(feedback, playerFinished, formatter) {
  if (playerFinished || feedback?.correct !== true || feedback.questionId == null) return null;
  const streak = Number.isSafeInteger(feedback.streak) && feedback.streak >= 0
    ? feedback.streak
    : 0;
  const isCombo = streak >= 2;
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

export function getStudentRaceHudModel(runtimeState, language = "he", answerFeedback = null) {
  if (runtimeState?.player == null) return null;

  const { player, totalDistance, playerCount } = runtimeState;
  const progressRatio = getRaceProgressRatio(player.position, totalDistance);
  const progressPercent = progressRatio == null ? null : Math.round(progressRatio * 100);
  const hasStanding = Number.isSafeInteger(player.rank) && player.rank > 0
    && Number.isSafeInteger(playerCount) && playerCount >= player.rank;
  const isCombo = Number.isSafeInteger(player.streak) && player.streak >= 2;
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
    streak: player.streak,
    streakText: new Intl.NumberFormat(language).format(player.streak),
    streakLabelKey: isCombo ? "hud.comboLabel" : "hud.streakShortLabel",
    isCombo,
    speed: player.speed,
    reward,
    rewardKey: reward?.id ?? "steady",
    style: { "--race-reward-duration": `${STUDENT_RACE_CONFIG.feedbackDelayMs}ms` },
    progressPercent,
    progressText: progressPercent == null ? null : `${progressPercent}%`,
    progressStyle: { width: `${progressPercent ?? 0}%` },
  };
}
