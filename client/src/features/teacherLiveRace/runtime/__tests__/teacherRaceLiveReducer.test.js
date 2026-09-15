import { describe, expect, it } from "vitest";

import {
  INITIAL_TEACHER_LIVE_STATE,
  TEACHER_LIVE_ACTIONS,
  teacherRaceLiveReducer,
} from "../teacherRaceLiveReducer";
import { mapTeacherRaceLiveState } from "../mapTeacherRaceLiveState";
import { mapTeacherLiveEventEnvelope } from "../liveEvents/mapTeacherLiveEventEnvelope";
import { teacherLiveEvent, teacherLiveStateResponse } from "../teacherRaceLiveTestFixtures";
import { TEACHER_LIVE_RECOVERY_REASONS } from "../teacherRaceLiveConstants";
import { TEACHER_LIVE_FEED_CONFIG } from "../../config/teacherLiveFeedConfig";

function loaded(state, overrides = {}, raceId = "7") {
  return teacherRaceLiveReducer(state, {
    type: TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED,
    raceId,
    runtime: mapTeacherRaceLiveState(teacherLiveStateResponse(overrides)),
  });
}

function received(state, overrides) {
  return teacherRaceLiveReducer(state, {
    type: TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED,
    event: mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides)),
  });
}

function answerEvent(version, racePlayerId = 91) {
  return { version, type: "QUESTION_ANSWERED", payload: { racePlayerId, questionId: version, correct: true } };
}

describe("teacherRaceLiveReducer", () => {
  it("loads authoritative state, counts loads and clears recovery", () => {
    const first = loaded(INITIAL_TEACHER_LIVE_STATE);
    expect(first.raceId).toBe("7");
    expect(first.runtime.eventVersion).toBe(12);
    expect(first.loadCount).toBe(1);

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

    for (let version = 13; version <= 13 + TEACHER_LIVE_FEED_CONFIG.maxItems; version += 1) {
      state = received(state, answerEvent(version));
    }

    expect(state.runtime.eventVersion).toBe(13 + TEACHER_LIVE_FEED_CONFIG.maxItems);
    expect(state.recentEvents).toHaveLength(TEACHER_LIVE_FEED_CONFIG.maxItems);
    expect(state.recentEvents[0].id).toBe(`${13 + TEACHER_LIVE_FEED_CONFIG.maxItems}:CORRECT_ANSWER:91`);
  });

  it("ignores stale events and keeps the same state reference", () => {
    const state = loaded(INITIAL_TEACHER_LIVE_STATE);

    expect(received(state, answerEvent(12))).toBe(state);
    expect(received(state, answerEvent(5))).toBe(state);
  });

  it("preserves recent feed across a recovery load of the same race and clears it for another race", () => {
    const withFeed = received(loaded(INITIAL_TEACHER_LIVE_STATE), answerEvent(13));
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
