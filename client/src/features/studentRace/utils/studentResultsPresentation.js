import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants.js";
import {
  STUDENT_RESULTS_DID_NOT_FINISH,
  STUDENT_RESULTS_HERO_BADGES,
  STUDENT_RESULTS_MOTION,
} from "../config/studentRaceResultsViewConfig.js";

const PERCENT_SCALE = 100;
const PROGRESS_SEGMENT_IDS = Object.freeze(["finished", "racing", "out"]);

export function resolveResultsProgressSegments(counts) {
  const total = PROGRESS_SEGMENT_IDS.reduce((sum, id) => sum + counts[id], 0);

  return PROGRESS_SEGMENT_IDS.map((id) => ({
    id,
    count: counts[id],
    percent: total > 0 ? (counts[id] / total) * PERCENT_SCALE : 0,
  }));
}

export function resolveResultRowMotion(racePlayerId, reducedMotion) {
  if (reducedMotion) {
    return { layout: false };
  }

  return { layout: "position", layoutId: `student-result-${racePlayerId}`, transition: STUDENT_RESULTS_MOTION.row };
}

export function resolveResultsEnterMotion(reducedMotion) {
  const { enter, instant } = STUDENT_RESULTS_MOTION;

  return { initial: enter.initial, animate: enter.animate, transition: reducedMotion ? instant : enter.transition };
}

export function resolveResultsHero({ me, raceFinished }) {
  const hasRank = me.rank != null;

  if (raceFinished && !me.finished) {
    return {
      eyebrowKey: null,
      headlineKey: "results.heroRaceEnded",
      sublineKeys: hasRank ? ["results.heroNotCompleted", "results.heroFinalRanking"] : ["results.heroNotCompleted"],
      badge: hasRank ? STUDENT_RESULTS_HERO_BADGES.RANK : null,
      podium: false,
    };
  }

  if (me.rankConfirmed && hasRank) {
    return {
      eyebrowKey: raceFinished ? "results.heroFinalLabel" : null,
      headlineKey: me.rankTied ? "results.heroRankTied" : "results.heroRank",
      sublineKeys: [],
      badge: STUDENT_RESULTS_HERO_BADGES.RANK,
      podium: true,
    };
  }

  return {
    eyebrowKey: null,
    headlineKey: "results.heroReached",
    sublineKeys: raceFinished ? [] : ["results.heroConfirming"],
    badge: raceFinished ? null : STUDENT_RESULTS_HERO_BADGES.PENDING,
    podium: true,
  };
}

export function resolveFinalRowStatus(participant) {
  return participant.status === RACE_PLAYER_STATUSES.FINISHED ? null : STUDENT_RESULTS_DID_NOT_FINISH;
}
