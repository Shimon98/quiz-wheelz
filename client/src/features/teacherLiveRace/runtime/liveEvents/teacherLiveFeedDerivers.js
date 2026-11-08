import { RACE_STREAK_MILESTONES } from "../../../../constants/raceGameplayConstants";
import {
  TEACHER_FEED_KINDS,
  TEACHER_FEED_MESSAGE_KEYS,
} from "../../config/teacherLiveFeedConfig";

const RACE_SCOPED_ITEM_SUFFIX = "race";
const LEAD_RANK = 1;
// Highest first, so a streak that jumps past both milestones at once is told once, at the higher one.
const STREAK_MILESTONES = Object.values(RACE_STREAK_MILESTONES).sort((left, right) => right - left);

function findPlayer(runtime, racePlayerId) {
  return (
    runtime.players.find((player) => player.racePlayerId === racePlayerId) ??
    null
  );
}

function buildFeedItem(kind, event, { racePlayerId = null, values = {} } = {}) {
  return {
    id: `${event.version}:${kind}:${racePlayerId ?? RACE_SCOPED_ITEM_SUFFIX}`,
    kind,
    messageKey: TEACHER_FEED_MESSAGE_KEYS[kind],
    values,
    racePlayerId,
    occurredAtEpochMs: event.occurredAtEpochMs,
  };
}

function buildPlayerItem(kind, event, player, values = {}) {
  return buildFeedItem(kind, event, {
    racePlayerId: player.racePlayerId,
    values: { name: player.displayName, ...values },
  });
}

function deriveRankItems(previousPlayer, player, event) {
  if (player.rank >= previousPlayer.rank) {
    return [];
  }

  return player.rank === LEAD_RANK
    ? [buildPlayerItem(TEACHER_FEED_KINDS.TOOK_LEAD, event, player)]
    : [buildPlayerItem(TEACHER_FEED_KINDS.RANK_UP, event, player, { rank: player.rank })];
}

function deriveStreakItems(previousPlayer, player, event) {
  const milestone = STREAK_MILESTONES.find(
    (count) => previousPlayer.streak < count && player.streak >= count,
  );

  return milestone == null
    ? []
    : [buildPlayerItem(TEACHER_FEED_KINDS.STREAK, event, player, { count: milestone })];
}

// Ranks and streaks are the server's own; the feed only compares the roster before and after this event.
function deriveRosterItems(
  previousRuntime,
  event,
  nextRuntime,
  excludedRacePlayerId = null,
) {
  return nextRuntime.players.flatMap((player) => {
    if (player.racePlayerId === excludedRacePlayerId) {
      return [];
    }

    const previousPlayer = findPlayer(previousRuntime, player.racePlayerId);

    if (previousPlayer == null) {
      return [];
    }

    return [
      ...deriveRankItems(previousPlayer, player, event),
      ...deriveStreakItems(previousPlayer, player, event),
    ];
  });
}

export function deriveNoFeedItems() {
  return [];
}

export function deriveQuestionAnsweredFeedItems(
  previousRuntime,
  event,
  nextRuntime,
) {
  const player = findPlayer(nextRuntime, event.payload.racePlayerId);

  if (player == null) {
    return [];
  }

  // S4-06: what the answer caused is told instead of a plain "correct answer"; Luck may follow a wrong answer too.
  if (event.payload.moments.length > 0) {
    return event.payload.moments.map(({ kind }) => buildPlayerItem(kind, event, player));
  }

  return event.payload.correct
    ? [buildPlayerItem(TEACHER_FEED_KINDS.CORRECT_ANSWER, event, player)]
    : [];
}

export function deriveProgressFeedItems(previousRuntime, event, nextRuntime) {
  return deriveRosterItems(previousRuntime, event, nextRuntime);
}

export function derivePlayerFinishedFeedItems(
  previousRuntime,
  event,
  nextRuntime,
) {
  const finisher = event.payload.player;

  return [
    buildPlayerItem(TEACHER_FEED_KINDS.PLAYER_FINISHED, event, finisher),
    ...deriveRosterItems(
      previousRuntime,
      event,
      nextRuntime,
      finisher.racePlayerId,
    ),
  ];
}

export function deriveRaceFinishedFeedItems(previousRuntime, event) {
  return [buildFeedItem(TEACHER_FEED_KINDS.RACE_FINISHED, event)];
}
