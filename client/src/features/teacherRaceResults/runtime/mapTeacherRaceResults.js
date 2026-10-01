import { ApiContractError } from "../../../errors/ApiContractError";
import {
  requireArray,
  requireNonEmptyString,
  requireObject,
  requireOneOf,
  requireOptionalEpochMs,
  requireSafeInteger,
} from "../../../errors/apiContractGuards";
import { RACE_MAX_PLAYERS } from "../../../constants/raceRulesConstants";
import { RACE_PLAYER_STATUSES, RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { RACE_RESULT_AWARD_TYPES } from "../../../constants/raceResultConstants";

const FINISHED_RACE_STATUSES = new Set([RACE_STATUSES.FINISHED]);
const PLAYER_STATUSES = new Set(Object.values(RACE_PLAYER_STATUSES));
const AWARD_TYPES = new Set(Object.values(RACE_RESULT_AWARD_TYPES));
const COUNT = Object.freeze({ min: 0 });
const POSITIVE = Object.freeze({ min: 1 });

function requireUnique(values, label) {
  if (new Set(values).size !== values.length) {
    throw new ApiContractError(`${label} repeat`);
  }

  return values;
}

function mapResultPlayer(player) {
  requireObject(player, "Results player");

  const status = requireOneOf(player.status, PLAYER_STATUSES, "Results player status");
  const finishedAtEpochMs = requireOptionalEpochMs(
    player.finishedAtEpochMs,
    "Results player finishedAtEpochMs",
  );

  if (status !== RACE_PLAYER_STATUSES.FINISHED && finishedAtEpochMs != null) {
    throw new ApiContractError("Results non-finisher carries a finish time");
  }

  return Object.freeze({
    racePlayerId: requireSafeInteger(player.racePlayerId, "Results player racePlayerId", POSITIVE),
    displayName: requireNonEmptyString(player.displayName, "Results player displayName"),
    vehicleColorKey: requireNonEmptyString(player.vehicleColorKey, "Results player vehicleColorKey"),
    vehicleAssetKey: requireNonEmptyString(player.vehicleAssetKey, "Results player vehicleAssetKey"),
    rank: requireSafeInteger(player.rank, "Results player rank", POSITIVE),
    score: requireSafeInteger(player.score, "Results player score", COUNT),
    correctAnswers: requireSafeInteger(player.correctAnswers, "Results player correctAnswers", COUNT),
    wrongAnswers: requireSafeInteger(player.wrongAnswers, "Results player wrongAnswers", COUNT),
    bestStreak: requireSafeInteger(player.bestStreak, "Results player bestStreak", COUNT),
    status,
    finishedAtEpochMs,
  });
}

function mapResultPlayers(players) {
  requireArray(players, "Results players", { maxLength: RACE_MAX_PLAYERS });

  const mapped = players.map(mapResultPlayer);

  requireUnique(mapped.map((player) => player.racePlayerId), "Results player ids");

  return Object.freeze(mapped);
}

function requireKnownIds(ids, knownIds, label) {
  requireArray(ids, label, { maxLength: RACE_MAX_PLAYERS });

  if (ids.some((id) => !knownIds.has(id))) {
    throw new ApiContractError(`${label} name an unknown player`);
  }

  return Object.freeze([...requireUnique(ids, label)]);
}

function mapAward(award, knownIds) {
  requireObject(award, "Results award");

  const racePlayerIds = requireKnownIds(award.racePlayerIds, knownIds, "Results award racePlayerIds");

  if (racePlayerIds.length === 0) {
    throw new ApiContractError("Results award has no players");
  }

  return Object.freeze({
    type: requireOneOf(award.type, AWARD_TYPES, "Results award type"),
    racePlayerIds,
    value: requireSafeInteger(award.value, "Results award value", POSITIVE),
  });
}

function mapAwards(awards, knownIds) {
  requireArray(awards, "Results awards", { maxLength: AWARD_TYPES.size });

  const mapped = awards.map((award) => mapAward(award, knownIds));

  requireUnique(mapped.map((award) => award.type), "Results award types");

  return Object.freeze(mapped);
}

function mapSummary(summary) {
  requireObject(summary, "Results summary");

  return Object.freeze({
    finishedPlayers: requireSafeInteger(summary.finishedPlayers, "Results summary finishedPlayers", COUNT),
    disconnectedPlayers: requireSafeInteger(
      summary.disconnectedPlayers,
      "Results summary disconnectedPlayers",
      COUNT,
    ),
    totalCorrectAnswers: requireSafeInteger(
      summary.totalCorrectAnswers,
      "Results summary totalCorrectAnswers",
      COUNT,
    ),
    totalWrongAnswers: requireSafeInteger(summary.totalWrongAnswers, "Results summary totalWrongAnswers", COUNT),
  });
}

function mapSubject(subject) {
  requireObject(subject, "Results subject");

  return Object.freeze({
    name: typeof subject.name === "string" ? subject.name : "",
    code: typeof subject.code === "string" ? subject.code : "",
  });
}

export function mapTeacherRaceResults(response) {
  requireObject(response, "Results response");

  const status = requireOneOf(response.status, FINISHED_RACE_STATUSES, "Results race status");
  const players = mapResultPlayers(response.players);
  const knownIds = new Set(players.map((player) => player.racePlayerId));

  if (requireSafeInteger(response.playerCount, "Results playerCount", COUNT) !== players.length) {
    throw new ApiContractError("Results playerCount does not match the players");
  }

  return Object.freeze({
    raceId: requireSafeInteger(response.raceId, "Results raceId", POSITIVE),
    title: requireNonEmptyString(response.title, "Results title"),
    subject: mapSubject(response.subject),
    status,
    playerCount: players.length,
    startedAtEpochMs: requireOptionalEpochMs(response.startedAtEpochMs, "Results startedAtEpochMs"),
    finishedAtEpochMs: requireOptionalEpochMs(response.finishedAtEpochMs, "Results finishedAtEpochMs"),
    winnerRacePlayerIds: requireKnownIds(response.winnerRacePlayerIds, knownIds, "Results winnerRacePlayerIds"),
    summary: mapSummary(response.summary),
    awards: mapAwards(response.awards, knownIds),
    players,
  });
}
