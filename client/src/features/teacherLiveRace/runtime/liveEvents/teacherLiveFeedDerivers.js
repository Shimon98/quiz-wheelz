import {
  TEACHER_FEED_KINDS,
  TEACHER_FEED_MESSAGE_KEYS,
} from "../../config/teacherLiveFeedConfig";

const RACE_SCOPED_ITEM_SUFFIX = "race";

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

function deriveRankUpItems(
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

    if (previousPlayer == null || player.rank >= previousPlayer.rank) {
      return [];
    }

    return [
      buildFeedItem(TEACHER_FEED_KINDS.RANK_UP, event, {
        racePlayerId: player.racePlayerId,
        values: { name: player.displayName, rank: player.rank },
      }),
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
  if (!event.payload.correct) {
    return [];
  }

  const player = findPlayer(nextRuntime, event.payload.racePlayerId);

  if (player == null) {
    return [];
  }

  return [
    buildFeedItem(TEACHER_FEED_KINDS.CORRECT_ANSWER, event, {
      racePlayerId: player.racePlayerId,
      values: { name: player.displayName },
    }),
  ];
}

export function deriveProgressFeedItems(previousRuntime, event, nextRuntime) {
  return deriveRankUpItems(previousRuntime, event, nextRuntime);
}

export function derivePlayerFinishedFeedItems(
  previousRuntime,
  event,
  nextRuntime,
) {
  const finisher = event.payload.player;

  return [
    buildFeedItem(TEACHER_FEED_KINDS.PLAYER_FINISHED, event, {
      racePlayerId: finisher.racePlayerId,
      values: { name: finisher.displayName },
    }),
    ...deriveRankUpItems(
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
