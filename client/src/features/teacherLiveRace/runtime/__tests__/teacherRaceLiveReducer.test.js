import { describe, expect, it } from "vitest";

import {
  INITIAL_TEACHER_LIVE_STATE,
  TEACHER_LIVE_ACTIONS,
  teacherRaceLiveReducer,
} from "../teacherRaceLiveReducer";
import { mapTeacherRaceLiveState } from "../mapTeacherRaceLiveState";
import { mapTeacherLiveEventEnvelope } from "../liveEvents/mapTeacherLiveEventEnvelope";
import { teacherLiveEvent, teacherLivePlayer, teacherLiveStateResponse } from "../teacherRaceLiveTestFixtures";
import { TEACHER_LIVE_RECOVERY_REASONS } from "../teacherRaceLiveConstants";
import { TEACHER_LIVE_FEED_CONFIG } from "../../config/teacherLiveFeedConfig";

const EVENT_EPOCH_MS = 1_755_600_001_000;
const { replayTtlMs, windowMs } = TEACHER_LIVE_FEED_CONFIG.admission;
const ROSTER = teacherLiveEvent().payload.players;

function loaded(state, overrides = {}, raceId = "7", receivedAtPerformanceNow = 500) {
  return teacherRaceLiveReducer(state, {
    type: TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED,
    raceId,
    runtime: mapTeacherRaceLiveState(teacherLiveStateResponse(overrides)),
    receivedAtPerformanceNow,
  });
}

function received(state, overrides, receivedAtPerformanceNow) {
  return teacherRaceLiveReducer(state, {
    type: TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED,
    event: mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides)),
    receivedAtPerformanceNow,
  });
}

function answerEvent(version, racePlayerId = 91, occurredAtEpochMs = EVENT_EPOCH_MS, moments = undefined) {
  return {
    version,
    type: "QUESTION_ANSWERED",
    occurredAtEpochMs,
    payload: { racePlayerId, questionId: version, correct: true, moments },
  };
}

function progressEvent(version, occurredAtEpochMs = EVENT_EPOCH_MS, players = ROSTER) {
  return { version, type: "PLAYER_PROGRESS_UPDATED", occurredAtEpochMs, payload: { players } };
}

// An answer as the server writes it: its QUESTION_ANSWERED event, then the progress event of the same answer.
function answered(state, version, { at = EVENT_EPOCH_MS, racePlayerId = 91, raceId = 7, moments, players } = {}) {
  const afterAnswer = received(state, { ...answerEvent(version, racePlayerId, at, moments), raceId });
  return received(afterAnswer, { ...progressEvent(version + 1, at, players), raceId });
}

const feedIds = (state) => state.recentEvents.map(({ id }) => id);

describe("teacherRaceLiveReducer", () => {
  it("loads authoritative state, counts loads and clears recovery", () => {
    const first = loaded(INITIAL_TEACHER_LIVE_STATE);
    expect(first.raceId).toBe("7");
    expect(first.runtime.eventVersion).toBe(12);
    expect(first.loadCount).toBe(1);
    expect(first.serverClock).toEqual({
      serverTimeEpochMs: 1_755_600_000_000,
      receivedAtPerformanceNow: 500,
    });

    const gapped = received(first, { version: 20 });
    expect(gapped.recovery).toEqual({ reason: TEACHER_LIVE_RECOVERY_REASONS.VERSION_GAP });
    expect(gapped.runtime).toBe(first.runtime);

    const recovered = loaded(gapped, { eventVersion: 20 });
    expect(recovered.recovery).toBeNull();
    expect(recovered.runtime.eventVersion).toBe(20);
    expect(recovered.loadCount).toBe(2);
  });

  it("applies live events, keeps the newest feed items first and trims to the configured maximum", () => {
    let state = loaded(INITIAL_TEACHER_LIVE_STATE);
    const { maxItems } = TEACHER_LIVE_FEED_CONFIG;

    // Each answer a whole admission window after the one before, so every answer is told.
    for (let n = 0; n <= maxItems; n += 1) {
      state = answered(state, 13 + n * 2, { at: EVENT_EPOCH_MS + n * windowMs });
    }

    expect(state.runtime.eventVersion).toBe(13 + maxItems * 2 + 1);
    expect(state.recentEvents).toHaveLength(maxItems);
    expect(state.recentEvents[0].id).toBe(`${13 + maxItems * 2}:CORRECT_ANSWER:91`);
  });

  it("ignores stale events and keeps the same state reference", () => {
    const state = loaded(INITIAL_TEACHER_LIVE_STATE);

    expect(received(state, answerEvent(12))).toBe(state);
    expect(received(state, answerEvent(5))).toBe(state);
  });

  it("preserves recent feed across a recovery load of the same race and clears it for another race", () => {
    const withFeed = answered(loaded(INITIAL_TEACHER_LIVE_STATE), 13);
    expect(withFeed.recentEvents).toHaveLength(1);

    expect(loaded(withFeed, { eventVersion: 30 }).recentEvents).toBe(withFeed.recentEvents);
    expect(loaded(withFeed, { raceId: 8, eventVersion: 1 }, "8").recentEvents).toEqual([]);
  });

  it("accepts a recovery request only while a non-finished runtime exists and none is pending", () => {
    const request = (state) =>
      teacherRaceLiveReducer(state, {
        type: TEACHER_LIVE_ACTIONS.RECOVERY_REQUESTED,
        reason: TEACHER_LIVE_RECOVERY_REASONS.STREAM_CLOSED,
      });

    expect(request(INITIAL_TEACHER_LIVE_STATE)).toBe(INITIAL_TEACHER_LIVE_STATE);

    const running = loaded(INITIAL_TEACHER_LIVE_STATE);
    const requested = request(running);
    expect(requested.recovery).toEqual({ reason: TEACHER_LIVE_RECOVERY_REASONS.STREAM_CLOSED });
    expect(request(requested)).toBe(requested);

    const finished = loaded(INITIAL_TEACHER_LIVE_STATE, { status: "FINISHED" });
    expect(request(finished)).toBe(finished);
  });

  it("ignores events before any runtime exists", () => {
    expect(received(INITIAL_TEACHER_LIVE_STATE, {})).toBe(INITIAL_TEACHER_LIVE_STATE);
  });
});

// C5-05: the feed tells fresh moments at a calm pace; the race itself always takes every event.
describe("teacher feed admission inside the reducer", () => {
  const danTakesTheLead = {
    payload: {
      players: [
        teacherLivePlayer({ racePlayerId: 92, displayName: "Dan", laneNumber: 2, rank: 1, position: 200 }),
        teacherLivePlayer({ rank: 2, position: 150 }),
      ],
    },
  };

  it("tells a fresh event, but applies the same event replayed past the limit without a line", () => {
    const state = loaded(INITIAL_TEACHER_LIVE_STATE);
    expect(feedIds(received(state, danTakesTheLead, 500))).toEqual(["13:TOOK_LEAD:92"]);

    // The event happened 1 s after the loaded server time; the screen gets it more than the limit after that.
    const replayed = received(state, danTakesTheLead, 500 + 1_000 + replayTtlMs + 1);
    expect(replayed.runtime.eventVersion).toBe(13);
    expect(replayed.runtime.players.find(({ racePlayerId }) => racePlayerId === 92).rank).toBe(1);
    expect(replayed.recentEvents).toEqual([]);
  });

  it("starts with no historical lines after the first load", () => {
    expect(loaded(INITIAL_TEACHER_LIVE_STATE).recentEvents).toEqual([]);
  });

  it("keeps its pace across a recovery of the same race and starts afresh for another race", () => {
    let state = answered(loaded(INITIAL_TEACHER_LIVE_STATE), 13);
    state = answered(state, 15, { at: EVENT_EPOCH_MS + 1_000 });
    expect(feedIds(state)).toEqual(["13:CORRECT_ANSWER:91"]);

    const recovered = answered(loaded(state, { eventVersion: 16 }), 17, { at: EVENT_EPOCH_MS + 2_000 });
    expect(feedIds(recovered)).toEqual(["13:CORRECT_ANSWER:91"]);

    const otherRace = loaded(state, { raceId: 8, eventVersion: 16 }, "8");
    expect(feedIds(answered(otherRace, 17, { at: EVENT_EPOCH_MS + 2_000, raceId: 8 }))).toEqual(["17:CORRECT_ANSWER:91"]);
  });
});

// An answer writes its QUESTION_ANSWERED event and, in the same transaction, the progress event with the server's new
// ranks and streaks: the feed tells one row for the whole answer, the strongest.
describe("one row per answer", () => {
  const noaWithStreak = (streak) => [teacherLivePlayer({ streak, position: 150 }), ROSTER[1]];

  it("waits for the answer's own progress event before telling it", () => {
    const afterAnswer = received(loaded(INITIAL_TEACHER_LIVE_STATE), answerEvent(13));

    expect(afterAnswer.runtime.eventVersion).toBe(13);
    expect(afterAnswer.recentEvents).toEqual([]);
    expect(feedIds(received(afterAnswer, progressEvent(14)))).toEqual(["13:CORRECT_ANSWER:91"]);
  });

  it("tells the streak the answer reached instead of a plain correct answer", () => {
    expect(feedIds(answered(loaded(INITIAL_TEACHER_LIVE_STATE), 13, { players: noaWithStreak(5) })))
      .toEqual(["14:STREAK:91"]);
  });

  it("tells a climb the answer brought instead of a plain correct answer", () => {
    const gil = { racePlayerId: 93, displayName: "Gil", laneNumber: 3, position: 60, streak: 0 };
    const state = loaded(INITIAL_TEACHER_LIVE_STATE, {
      players: [teacherLivePlayer(), teacherLivePlayer({ ...ROSTER[1], rank: 2 }), teacherLivePlayer({ ...gil, rank: 3 })],
    });
    const climbed = [teacherLivePlayer(), teacherLivePlayer({ ...gil, rank: 2, position: 100 }), teacherLivePlayer({ ...ROSTER[1], rank: 3 })];

    expect(feedIds(answered(state, 13, { racePlayerId: 93, players: climbed }))).toEqual(["14:RANK_UP:93"]);
  });

  it("tells the answer's own moment over the lead it brought", () => {
    const danLeads = [teacherLivePlayer({ ...ROSTER[1], rank: 1, position: 300 }), teacherLivePlayer({ rank: 2 })];

    expect(feedIds(answered(loaded(INITIAL_TEACHER_LIVE_STATE), 13, {
      racePlayerId: 92, moments: [{ kind: "TURBO_SUCCESS", sourceId: 5 }], players: danLeads,
    }))).toEqual(["13:TURBO_SUCCESS:92"]);
  });

  it("forgets a waiting answer when an authoritative reload replaces the race", () => {
    const afterAnswer = received(loaded(INITIAL_TEACHER_LIVE_STATE), answerEvent(13));
    const reloaded = loaded(afterAnswer, { eventVersion: 13 });

    expect(received(reloaded, progressEvent(14)).recentEvents).toEqual([]);
  });
});
