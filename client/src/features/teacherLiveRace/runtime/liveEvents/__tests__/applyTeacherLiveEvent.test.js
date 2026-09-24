import { describe, expect, it } from "vitest";

import { applyTeacherLiveEvent } from "../applyTeacherLiveEvent";
import { mapTeacherLiveEventEnvelope } from "../mapTeacherLiveEventEnvelope";
import { mapTeacherRaceLiveState } from "../../mapTeacherRaceLiveState";
import {
  teacherLiveEvent,
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../teacherRaceLiveTestFixtures";
import {
  TEACHER_LIVE_EVENT_OUTCOMES,
  TEACHER_LIVE_RECOVERY_REASONS,
} from "../../teacherRaceLiveConstants";

function runtimeAt(version = 12) {
  return mapTeacherRaceLiveState(teacherLiveStateResponse({ eventVersion: version }));
}

function event(overrides) {
  return mapTeacherLiveEventEnvelope(teacherLiveEvent(overrides));
}

describe("applyTeacherLiveEvent gates", () => {
  it("ignores stale and duplicate versions without touching the runtime", () => {
    const runtime = runtimeAt(12);

    for (const version of [11, 12]) {
      const result = applyTeacherLiveEvent(runtime, event({ version }));
      expect(result.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.STALE);
      expect(result.runtime).toBe(runtime);
      expect(result.feedItems).toEqual([]);
    }
  });

  it("requires recovery on a version gap, a wrong race and a malformed known payload", () => {
    const runtime = runtimeAt(12);

    const gap = applyTeacherLiveEvent(runtime, event({ version: 14 }));
    expect(gap.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED);
    expect(gap.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.VERSION_GAP);

    const wrongRace = applyTeacherLiveEvent(runtime, event({ raceId: 8 }));
    expect(wrongRace.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.RACE_MISMATCH);

    const malformed = applyTeacherLiveEvent(runtime, event({ payload: { players: null } }));
    expect(malformed.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED);
    expect(malformed.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.MALFORMED_PAYLOAD);
    expect(malformed.runtime).toBe(runtime);
  });

  it("advances only the version for an unknown contiguous future event", () => {
    const runtime = runtimeAt(10);

    const result = applyTeacherLiveEvent(
      runtime,
      event({ version: 11, type: "FUTURE_POWER_UP_EVENT", payload: { anything: true } }),
    );

    expect(result.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.APPLIED);
    expect(result.runtime).toEqual({ ...runtime, eventVersion: 11 });
    expect(result.runtime.players).toBe(runtime.players);
    expect(result.feedItems).toEqual([]);
  });

  it("still recovers when an unknown future event leaves a gap", () => {
    const result = applyTeacherLiveEvent(
      runtimeAt(10),
      event({ version: 13, type: "FUTURE_POWER_UP_EVENT" }),
    );

    expect(result.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.VERSION_GAP);
  });

  it("turns a contract violation raised while applying a known event into recovery", () => {
    const fullRoster = Array.from({ length: 8 }, (_, index) =>
      teacherLivePlayer({ racePlayerId: index + 1, laneNumber: index + 1, rank: index + 1 }),
    );
    const runtime = mapTeacherRaceLiveState(
      teacherLiveStateResponse({ eventVersion: 12, players: fullRoster }),
    );
    const ninth = teacherLivePlayer({ racePlayerId: 99, laneNumber: 8, rank: 9 });

    const overflow = applyTeacherLiveEvent(
      runtime,
      event({ type: "PLAYER_JOINED", payload: { player: ninth } }),
    );
    expect(overflow.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED);
    expect(overflow.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.MALFORMED_PAYLOAD);
    expect(overflow.runtime).toBe(runtime);
    expect(overflow.feedItems).toEqual([]);

    const rejoined = applyTeacherLiveEvent(
      runtime,
      event({ type: "PLAYER_JOINED", payload: { player: teacherLivePlayer({ racePlayerId: 3, laneNumber: 3, rank: 3, displayName: "Back" }) } }),
    );
    expect(rejoined.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.APPLIED);
    expect(rejoined.runtime.players).toHaveLength(8);
    expect(rejoined.runtime.players[2].displayName).toBe("Back");
  });

  it("lets a programming error inside a known definition propagate", () => {
    const brokenRuntime = { ...runtimeAt(12), players: null };

    expect(() =>
      applyTeacherLiveEvent(
        brokenRuntime,
        event({ type: "PLAYER_JOINED", payload: { player: teacherLivePlayer() } }),
      ),
    ).toThrow(TypeError);
  });
});

describe("applyTeacherLiveEvent known events", () => {
  it("upserts a joined player without sorting or ranking", () => {
    const runtime = runtimeAt(12);
    const joined = teacherLivePlayer({ racePlayerId: 93, displayName: "Lior", laneNumber: 3, rank: 3, position: 0 });

    const appended = applyTeacherLiveEvent(
      runtime,
      event({ type: "PLAYER_JOINED", payload: { player: joined } }),
    );
    expect(appended.runtime.players.map((player) => player.racePlayerId)).toEqual([91, 92, 93]);
    expect(appended.runtime.eventVersion).toBe(13);

    const replaced = applyTeacherLiveEvent(
      appended.runtime,
      event({ version: 14, type: "PLAYER_JOINED", payload: { player: { ...joined, displayName: "Lior B" } } }),
    );
    expect(replaced.runtime.players.map((player) => player.displayName)).toEqual(["Noa", "Dan", "Lior B"]);
  });

  it.each([
    ["a new player", teacherLivePlayer({ racePlayerId: 93, displayName: "Lior", laneNumber: 2, rank: 3 })],
    ["an existing player moving", teacherLivePlayer({ laneNumber: 2 })],
  ])("recovers when %s claims another player's lane", (_label, player) => {
    const runtime = runtimeAt(12);

    const result = applyTeacherLiveEvent(
      runtime,
      event({ type: "PLAYER_JOINED", payload: { player } }),
    );

    expect(result.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.RECOVERY_REQUIRED);
    expect(result.recoveryReason).toBe(TEACHER_LIVE_RECOVERY_REASONS.MALFORMED_PAYLOAD);
    expect(result.runtime).toBe(runtime);
    expect(result.feedItems).toEqual([]);
  });

  it("accepts an existing player updated on its own lane", () => {
    const result = applyTeacherLiveEvent(
      runtimeAt(12),
      event({ type: "PLAYER_JOINED", payload: { player: teacherLivePlayer({ displayName: "Noa B" }) } }),
    );

    expect(result.kind).toBe(TEACHER_LIVE_EVENT_OUTCOMES.APPLIED);
    expect(
      result.runtime.players.map(({ racePlayerId, laneNumber, displayName }) => [racePlayerId, laneNumber, displayName]),
    ).toEqual([[91, 1, "Noa B"], [92, 2, "Dan"]]);
  });

  it("applies race start, keeps unrelated race metadata and replaces the roster", () => {
    const runtime = mapTeacherRaceLiveState(
      teacherLiveStateResponse({ status: "WAITING_FOR_PLAYERS", eventVersion: 2 }),
    );

    const result = applyTeacherLiveEvent(
      runtime,
      event({
        version: 3,
        type: "RACE_STARTED",
        payload: { raceStatus: "IN_PROGRESS", startedAtEpochMs: 1_755_600_000_500, players: [teacherLivePlayer()] },
      }),
    );

    expect(result.runtime.race).toEqual({
      ...runtime.race,
      status: "IN_PROGRESS",
      startedAtEpochMs: 1_755_600_000_500,
    });
    expect(result.runtime.players).toHaveLength(1);
  });

  it("keeps the domain unchanged for an answer and replaces the full roster on progress", () => {
    const runtime = runtimeAt(12);

    const answered = applyTeacherLiveEvent(
      runtime,
      event({ type: "QUESTION_ANSWERED", payload: { racePlayerId: 91, questionId: 5, correct: true } }),
    );
    expect(answered.runtime.players).toBe(runtime.players);
    expect(answered.runtime.eventVersion).toBe(13);

    const progressed = applyTeacherLiveEvent(answered.runtime, event({ version: 14 }));
    expect(progressed.runtime.players.map((player) => player.position)).toEqual([140, 95]);
  });

  it("applies player finish and race finish as full roster replacements with terminal race state", () => {
    const runtime = runtimeAt(12);
    const finisher = teacherLivePlayer({ status: "FINISHED", position: 1000 });
    const roster = [finisher, teacherLivePlayer({ racePlayerId: 92, laneNumber: 2, rank: 2, position: 500 })];

    const playerFinished = applyTeacherLiveEvent(
      runtime,
      event({ type: "PLAYER_FINISHED", payload: { player: finisher, finishedAtEpochMs: 1_755_600_050_000, players: roster } }),
    );
    expect(playerFinished.runtime.players[0].status).toBe("FINISHED");
    expect(playerFinished.runtime.race.finishedAtEpochMs).toBeNull();

    const raceFinished = applyTeacherLiveEvent(
      playerFinished.runtime,
      event({ version: 14, type: "RACE_FINISHED", payload: { raceStatus: "FINISHED", finishedAtEpochMs: 1_755_600_090_000, players: roster } }),
    );
    expect(raceFinished.runtime.race.status).toBe("FINISHED");
    expect(raceFinished.runtime.race.finishedAtEpochMs).toBe(1_755_600_090_000);
    expect(raceFinished.runtime.eventVersion).toBe(14);
  });

  it("replaces the roster in the incoming server standings order instead of keeping old array positions", () => {
    const runtime = mapTeacherRaceLiveState(
      teacherLiveStateResponse({
        players: [
          teacherLivePlayer({ racePlayerId: 1, displayName: "Dan", laneNumber: 1, rank: 1, position: 300 }),
          teacherLivePlayer({ racePlayerId: 2, displayName: "Maya", laneNumber: 2, rank: 2, position: 200 }),
          teacherLivePlayer({ racePlayerId: 3, displayName: "Lior", laneNumber: 3, rank: 3, position: 100 }),
        ],
      }),
    );

    const reordered = applyTeacherLiveEvent(
      runtime,
      event({
        payload: {
          players: [
            teacherLivePlayer({ racePlayerId: 2, displayName: "Maya", laneNumber: 2, rank: 1, position: 320 }),
            teacherLivePlayer({ racePlayerId: 1, displayName: "Dan", laneNumber: 1, rank: 2, position: 310 }),
            teacherLivePlayer({ racePlayerId: 3, displayName: "Lior", laneNumber: 3, rank: 3, position: 100 }),
          ],
        },
      }),
    );

    expect(reordered.runtime.players.map((player) => player.racePlayerId)).toEqual([2, 1, 3]);
    expect(reordered.runtime.players.map((player) => player.rank)).toEqual([1, 2, 3]);
  });
});
