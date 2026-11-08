import correctAnswer from "../../assets/game/raceMoments/moment-correct.webp";
import rankUp from "../../assets/game/raceMoments/moment-rank-up.webp";
import shieldEarned from "../../assets/game/raceMoments/moment-shield-earned.webp";
import luckTailwind from "../../assets/game/raceMoments/moment-luck-tailwind.webp";
import luckEnergyOrb from "../../assets/game/raceMoments/moment-luck-energy-orb.webp";
import luckMud from "../../assets/game/raceMoments/moment-luck-mud.webp";
import luckShieldBlocked from "../../assets/game/raceMoments/moment-luck-shield-blocked.webp";
import playerFinished from "../../assets/game/raceMoments/moment-player-finished.webp";

// Astra V5 (2026-11-07): the race moments the projector's live feed and the student's notice line tell. The other
// moments keep the paintings the game already shows for them; each screen's presentation config takes those from
// their own owners.
export const RACE_MOMENT_ART = Object.freeze({
  correctAnswer,
  rankUp,
  shieldEarned,
  luckTailwind,
  luckEnergyOrb,
  luckMud,
  luckShieldBlocked,
  playerFinished,
});
