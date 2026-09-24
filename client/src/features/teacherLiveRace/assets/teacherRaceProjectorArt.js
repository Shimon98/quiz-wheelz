import jungleBackdrop from "../../../assets/game/teacherRace/projector/teacher-jungle-backdrop.webp";
import startSign from "../../../assets/game/teacherRace/projector/teacher-start-sign.webp";
import finishSign from "../../../assets/game/teacherRace/projector/teacher-finish-sign.webp";
import jungleVerge from "../../../assets/game/teacherRace/projector/teacher-jungle-verge.webp";
import leaderboardTrophy from "../../../assets/game/teacherRace/projector/teacher-leaderboard-trophy.webp";
import liveEventsBolt from "../../../assets/game/teacherRace/projector/teacher-live-events-bolt.webp";
import connectionWifi from "../../../assets/game/teacherRace/projector/teacher-connection-wifi.webp";
import titleBadge from "../../../assets/game/teacherRace/projector/teacher-title-badge.webp";

export const TEACHER_RACE_PROJECTOR_ART = Object.freeze({
  backdrop: jungleBackdrop,
  verge: jungleVerge,
  signs: Object.freeze({
    start: startSign,
    finish: finishSign,
  }),
  uiAccents: Object.freeze({
    leaderboardTrophy,
    liveEventsBolt,
    connectionWifi,
    titleBadge,
  }),
});
