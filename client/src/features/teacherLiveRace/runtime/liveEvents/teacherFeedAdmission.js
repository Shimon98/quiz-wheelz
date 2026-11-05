import {
  TEACHER_FEED_KINDS,
  TEACHER_FEED_PRIORITY,
  TEACHER_FEED_PRIORITY_OF_KIND,
  TEACHER_LIVE_FEED_CONFIG,
} from "../../config/teacherLiveFeedConfig";

const ADMISSION = TEACHER_LIVE_FEED_CONFIG.admission;

// All the pace rules need: when the class's last quiet rows (and plain correct answers among them) were shown, when
// each student last had a quiet row, and when the last new leader was told.
export const EMPTY_FEED_ADMISSION = Object.freeze({
  windowAdmissions: Object.freeze([]),
  lowestAdmissions: Object.freeze([]),
  lastAdmittedAtByPlayer: Object.freeze({}),
  lastLeadAdmittedAt: null,
});

const priorityOf = ({ kind }) =>
  TEACHER_FEED_PRIORITY_OF_KIND[kind] ?? TEACHER_FEED_PRIORITY.LOW;

const isQuiet = (item) => priorityOf(item) > TEACHER_FEED_PRIORITY.HIGH;

const isLead = ({ kind }) => kind === TEACHER_FEED_KINDS.TOOK_LEAD;

const isLowest = (item) => priorityOf(item) === TEACHER_FEED_PRIORITY.LOWEST;

// One row per student per event, the strongest one; race-wide rows always stay. Equals keep the server's order.
function strongestFirst(candidates) {
  const strongestByPlayer = new Map();

  for (const item of candidates) {
    const kept = strongestByPlayer.get(item.racePlayerId);

    if (item.racePlayerId != null && (kept == null || priorityOf(item) < priorityOf(kept))) {
      strongestByPlayer.set(item.racePlayerId, item);
    }
  }

  return candidates
    .filter(
      (item) =>
        item.racePlayerId == null ||
        strongestByPlayer.get(item.racePlayerId) === item,
    )
    .sort((left, right) => priorityOf(left) - priorityOf(right));
}

// Keeps only what still matters at this event's server time. A server clock that stepped back re-anchors the
// remembered times at the new time, so a window lasts its own length: it neither opens for every row nor stays
// shut until the old time comes back.
function recallAt(memory, nowEpochMs) {
  const anchored = (epochMs) => Math.min(epochMs, nowEpochMs);
  const lastLead = memory.lastLeadAdmittedAt == null ? null : anchored(memory.lastLeadAdmittedAt);

  const inWindow = (epochMs) => nowEpochMs - epochMs < ADMISSION.windowMs;

  return {
    windowAdmissions: memory.windowAdmissions.map(anchored).filter(inWindow),
    lowestAdmissions: memory.lowestAdmissions.map(anchored).filter(inWindow),
    lastAdmittedAtByPlayer: Object.fromEntries(
      Object.entries(memory.lastAdmittedAtByPlayer)
        .map(([racePlayerId, epochMs]) => [racePlayerId, anchored(epochMs)])
        .filter(([, epochMs]) => nowEpochMs - epochMs < ADMISSION.playerCooldownMs),
    ),
    lastLeadAdmittedAt: lastLead != null && nowEpochMs - lastLead < ADMISSION.leadCooldownMs ? lastLead : null,
  };
}

// Pure: decides which derived rows reach the projector. Times are the event's own server occurredAtEpochMs, so a
// replay decides like the live run did; eventAgeMs is how old the event was when it reached this screen.
export function admitFeedItems(memory, candidates, { occurredAtEpochMs, eventAgeMs }) {
  if (candidates.length === 0 || eventAgeMs > ADMISSION.replayTtlMs) {
    // A late replay still moved the race (the reducer applied it); its rows are just not news any more.
    return { admitted: [], memory };
  }

  const recalled = recallAt(memory, occurredAtEpochMs);
  const { windowAdmissions, lowestAdmissions, lastAdmittedAtByPlayer } = recalled;
  // A lead that changes hands again inside its quiet time is not news (the leaderboard shows it); dropping it before
  // the one-row-per-student choice leaves room for that student's other news from the same event.
  const leadQuiet = recalled.lastLeadAdmittedAt != null;
  const admitted = [];

  for (const item of strongestFirst(candidates.filter((item) => !(leadQuiet && isLead(item))))) {
    const quiet = isQuiet(item);

    if (
      quiet &&
      (windowAdmissions.length >= ADMISSION.lowPriorityPerWindow ||
        Object.hasOwn(lastAdmittedAtByPlayer, item.racePlayerId) ||
        (isLowest(item) && lowestAdmissions.length >= ADMISSION.lowestPerWindow))
    ) {
      continue;
    }

    admitted.push(item);

    if (isLowest(item)) {
      lowestAdmissions.push(occurredAtEpochMs);
    }

    // Only quieter rows pace a student: a lead or a finish never holds back that student's own news.
    if (quiet) {
      windowAdmissions.push(occurredAtEpochMs);

      if (item.racePlayerId != null) {
        lastAdmittedAtByPlayer[item.racePlayerId] = occurredAtEpochMs;
      }
    }
  }

  return {
    admitted,
    memory: {
      windowAdmissions,
      lowestAdmissions,
      lastAdmittedAtByPlayer,
      lastLeadAdmittedAt: admitted.some(isLead) ? occurredAtEpochMs : recalled.lastLeadAdmittedAt,
    },
  };
}
