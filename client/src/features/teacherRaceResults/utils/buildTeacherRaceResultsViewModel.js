import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants";
import { resolveRaceVehicleFrontArt } from "../../../shared/raceVehicles/raceVehicleFrontArt";
import { resolveVehicleCssColor } from "../../../shared/raceVehicles/raceVehicleIdentity";
import { resolveRaceVehicleSideArt } from "../../../shared/raceVehicles/raceVehicleSideArt";
import { formatElapsedClock } from "../../teacherLiveRace/utils/formatElapsedClock";
import { resolveRaceElapsedMs } from "../../teacherLiveRace/utils/teacherServerClock";
import { formatRaceDate, getSubjectDisplayName } from "../../teacherWorkspace/utils/raceDisplayUtils";
import { TEACHER_RESULTS_AWARD_VISIBLE_NAMES } from "../config/teacherRaceResultsConfig";
import { compactResultNameList, formatResultNameList } from "./formatResultNameList";

function resolveFinishElapsedMs(finishedAtEpochMs, startedAtEpochMs) {
  if (finishedAtEpochMs == null || startedAtEpochMs == null) {
    return null;
  }

  return Math.max(0, finishedAtEpochMs - startedAtEpochMs);
}

function buildStandingRow(player, startedAtEpochMs) {
  const finished = player.status === RACE_PLAYER_STATUSES.FINISHED;

  return Object.freeze({
    racePlayerId: player.racePlayerId,
    displayName: player.displayName,
    rank: player.rank,
    placementArtEligible: finished,
    accentColor: resolveVehicleCssColor(player.vehicleColorKey),
    vehicleSrc: resolveRaceVehicleSideArt(player.vehicleAssetKey),
    heroVehicleSrc: resolveRaceVehicleFrontArt(player.vehicleAssetKey),
    score: player.score,
    correctAnswers: player.correctAnswers,
    wrongAnswers: player.wrongAnswers,
    bestStreak: player.bestStreak,
    finished,
    finishTimeLabel: formatElapsedClock(resolveFinishElapsedMs(player.finishedAtEpochMs, startedAtEpochMs)),
  });
}

export function buildTeacherRaceResultsViewModel(results, language) {
  const standings = Object.freeze(
    results.players.map((player) => buildStandingRow(player, results.startedAtEpochMs)),
  );
  const rowsById = new Map(standings.map((row) => [row.racePlayerId, row]));
  const pickRows = (ids) => Object.freeze(ids.map((id) => rowsById.get(id)));

  return Object.freeze({
    header: Object.freeze({
      title: results.title,
      subjectName: getSubjectDisplayName(results, language),
      finishedAtLabel: formatRaceDate(results.finishedAtEpochMs, language),
    }),
    summary: Object.freeze({
      participants: results.playerCount,
      finished: results.summary.finishedPlayers,
      didNotFinish: results.summary.disconnectedPlayers,
      correctAnswers: results.summary.totalCorrectAnswers,
      wrongAnswers: results.summary.totalWrongAnswers,
      duration: formatElapsedClock(resolveRaceElapsedMs(results, null)),
    }),
    winners: pickRows(results.winnerRacePlayerIds),
    awards: Object.freeze(
      results.awards.map((award) => {
        const players = pickRows(award.racePlayerIds);
        const names = players.map((player) => player.displayName);
        const { visibleParts, hiddenCount } = compactResultNameList(
          names,
          language,
          TEACHER_RESULTS_AWARD_VISIBLE_NAMES,
        );

        return Object.freeze({
          type: award.type,
          value: award.value,
          namesLabel: formatResultNameList(names, language),
          visibleNameParts: Object.freeze(visibleParts),
          hiddenNameCount: hiddenCount,
          players,
        });
      }),
    ),
    standings,
  });
}
