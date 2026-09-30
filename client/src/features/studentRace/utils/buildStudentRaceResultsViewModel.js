import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants.js";
import { resolveRaceVehicleFrontArt } from "../../../shared/raceVehicles/raceVehicleFrontArt.js";
import { resolveVehicleCssColor } from "../../../shared/raceVehicles/raceVehicleIdentity.js";
import { resolveRaceVehicleSideArt } from "../../../shared/raceVehicles/raceVehicleSideArt.js";
import { STUDENT_RESULT_GROUPS, STUDENT_RESULTS_PHASES } from "../config/studentRaceResultsConfig.js";
import { isStudentSelfFinished, resolveStudentResultsPhase } from "./studentRaceResultsStatus.js";

const { DISCONNECTED, FINISHED } = RACE_PLAYER_STATUSES;

function listParticipants(runtimeState) {
  const self = {
    ...runtimeState.player,
    status: isStudentSelfFinished(runtimeState) ? FINISHED : runtimeState.playerStatus,
    isMe: true,
  };

  return [self, ...runtimeState.opponents.map((opponent) => ({ ...opponent, isMe: false }))];
}

function toParticipant(source, rank, status = source.status) {
  return Object.freeze({
    racePlayerId: source.racePlayerId,
    displayName: source.displayName,
    vehicleColorKey: source.vehicleColorKey,
    vehicleAssetKey: source.vehicleAssetKey,
    vehicleSrc: resolveRaceVehicleSideArt(source.vehicleAssetKey),
    accentColor: resolveVehicleCssColor(source.vehicleColorKey),
    status,
    isMe: source.isMe,
    rank,
    placementArtEligible: status === FINISHED && rank != null,
  });
}

function isStillRacing(participant) {
  return participant.status !== FINISHED && participant.status !== DISCONNECTED;
}

function countByStatus(participants) {
  return Object.freeze({
    finished: participants.filter((participant) => participant.status === FINISHED).length,
    racing: participants.filter(isStillRacing).length,
    out: participants.filter((participant) => participant.status === DISCONNECTED).length,
  });
}

function buildWatchingGroups(participants, confirmedFinishers) {
  const byId = new Map(participants.map((participant) => [participant.racePlayerId, participant]));
  const confirmedIds = new Set();
  const ranked = [];

  for (const finisher of confirmedFinishers) {
    const participant = byId.get(finisher.racePlayerId);

    if (participant != null) {
      confirmedIds.add(finisher.racePlayerId);
      ranked.push(toParticipant(participant, finisher.rank, FINISHED));
    }
  }

  const unranked = participants.filter((participant) => !confirmedIds.has(participant.racePlayerId));
  const pick = (predicate) => Object.freeze(unranked.filter(predicate).map((participant) => toParticipant(participant, null)));

  return Object.freeze({
    [STUDENT_RESULT_GROUPS.RANKED]: Object.freeze(ranked),
    [STUDENT_RESULT_GROUPS.CONFIRMING]: pick((participant) => participant.status === FINISHED),
    [STUDENT_RESULT_GROUPS.RACING]: pick(isStillRacing),
    [STUDENT_RESULT_GROUPS.OUT]: pick((participant) => participant.status === DISCONNECTED),
  });
}

function buildFinalCohorts([me, ...opponents]) {
  const cohorts = [];
  const append = (participant) => {
    const last = cohorts.at(-1);
    const row = toParticipant(participant, participant.rank ?? null);

    if (last != null && last.rank === row.rank) {
      last.participants.push(row);
    } else {
      cohorts.push({ rank: row.rank, participants: [row] });
    }
  };
  let mePlaced = false;

  for (const opponent of opponents) {
    if (!mePlaced && me.rank != null && me.rank <= opponent.rank) {
      append(me);
      mePlaced = true;
    }
    append(opponent);
  }

  if (!mePlaced) {
    append(me);
  }

  return Object.freeze(
    cohorts.map((cohort) => Object.freeze({ rank: cohort.rank, participants: Object.freeze(cohort.participants) })),
  );
}

function resolveOwnRank(runtimeState, phase, confirmedFinishers) {
  const ownId = runtimeState.player.racePlayerId;

  if (phase === STUDENT_RESULTS_PHASES.FINAL) {
    const rank = runtimeState.player.rank ?? null;

    return { rank, confirmed: rank != null, tied: rank != null && runtimeState.opponents.some((opponent) => opponent.rank === rank) };
  }

  const own = confirmedFinishers.find((finisher) => finisher.racePlayerId === ownId);

  if (own == null) {
    return { rank: null, confirmed: false, tied: false };
  }

  return {
    rank: own.rank,
    confirmed: true,
    tied: confirmedFinishers.some((finisher) => finisher.rank === own.rank && finisher.racePlayerId !== ownId),
  };
}

export function buildStudentRaceResultsViewModel(runtimeState, finishOrder) {
  const phase = resolveStudentResultsPhase(runtimeState);

  if (phase == null) {
    return null;
  }

  const final = phase === STUDENT_RESULTS_PHASES.FINAL;
  const participants = listParticipants(runtimeState);
  const confirmedFinishers = finishOrder?.confirmedFinishers ?? [];
  const ownRank = resolveOwnRank(runtimeState, phase, confirmedFinishers);
  const ownFinished = isStudentSelfFinished(runtimeState);
  const { player } = runtimeState;

  return Object.freeze({
    phase,
    raceTitle: runtimeState.race.title,
    raceFinished: final,
    passiveSyncNeeded: !final,
    playerCount: runtimeState.playerCount ?? participants.length,
    counts: countByStatus(participants),
    me: Object.freeze({
      racePlayerId: player.racePlayerId,
      displayName: player.displayName,
      vehicleColorKey: player.vehicleColorKey,
      vehicleAssetKey: player.vehicleAssetKey,
      vehicleSrc: resolveRaceVehicleSideArt(player.vehicleAssetKey),
      heroVehicleSrc: resolveRaceVehicleFrontArt(player.vehicleAssetKey),
      accentColor: resolveVehicleCssColor(player.vehicleColorKey),
      score: player.score,
      highestStreak: player.highestStreak,
      finished: ownFinished,
      rank: ownRank.rank,
      rankConfirmed: ownRank.confirmed,
      rankTied: ownRank.tied,
      placementArtEligible: ownFinished && ownRank.confirmed,
    }),
    groups: final ? null : buildWatchingGroups(participants, confirmedFinishers),
    finalCohorts: final ? buildFinalCohorts(participants) : null,
  });
}
