import medalGold from "../../assets/game/raceResults/medals/race-medal-gold.webp";
import medalSilver from "../../assets/game/raceResults/medals/race-medal-silver.webp";
import medalBronze from "../../assets/game/raceResults/medals/race-medal-bronze.webp";
import placementBadge from "../../assets/game/raceResults/medals/race-placement-badge.webp";
import awardTrophy from "../../assets/game/raceResults/awards/award-trophy.webp";
import awardTarget from "../../assets/game/raceResults/awards/award-target.webp";
import awardStreak from "../../assets/game/raceResults/awards/award-streak.webp";
import statScore from "../../assets/game/raceResults/stats/stat-score.webp";
import statStreak from "../../assets/game/raceResults/stats/stat-streak.webp";
import podium from "../../assets/game/raceResults/stage/results-podium.webp";
import titlePlaque from "../../assets/game/raceResults/stage/results-title-plaque.webp";

export const RACE_RESULTS_ART = Object.freeze({
  placement: Object.freeze({
    gold: medalGold,
    silver: medalSilver,
    bronze: medalBronze,
    wood: placementBadge,
  }),
  awards: Object.freeze({
    trophy: awardTrophy,
    target: awardTarget,
    streak: awardStreak,
  }),
  stats: Object.freeze({
    score: statScore,
    streak: statStreak,
  }),
  podium,
  titlePlaque,
});
