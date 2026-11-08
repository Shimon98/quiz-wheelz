import { describe, expect, it } from "vitest";

import { admitFeedItems, EMPTY_FEED_ADMISSION } from "../teacherFeedAdmission";
import { TEACHER_FEED_KINDS as K, TEACHER_LIVE_FEED_CONFIG } from "../../../config/teacherLiveFeedConfig";

const T = 1_755_600_001_000;
const { replayTtlMs, lowPriorityPerWindow } = TEACHER_LIVE_FEED_CONFIG.admission;

const row = (kind, racePlayerId = null) => ({ id: `${kind}:${racePlayerId ?? "race"}`, kind, racePlayerId });

// Feeds events one after another, as the reducer does, and returns the ids each one let through.
function admitInTurn(steps) {
  let memory = EMPTY_FEED_ADMISSION;

  return steps.map(({ at, rows, ageMs = 0 }) => {
    const result = admitFeedItems(memory, rows, { occurredAtEpochMs: at, eventAgeMs: ageMs });
    memory = result.memory;
    return result.admitted.map(({ id }) => id);
  });
}

describe("teacher feed admission", () => {
  it("keeps one row per student per event: the strongest first, equals in the server's order", () => {
    expect(admitInTurn([{
      at: T,
      rows: [
        row(K.CORRECT_ANSWER, 91),
        row(K.RANK_UP, 92),
        row(K.TURBO_SUCCESS, 91),
        row(K.PLAYER_FINISHED, 93),
        row(K.LUCK_TAILWIND, 94),
        row(K.STREAK, 94),
      ],
    }])).toEqual([["PLAYER_FINISHED:93", "TURBO_SUCCESS:91", "LUCK_TAILWIND:94", "RANK_UP:92"]]);
  });

  it("never holds back a top or high row, even with the class window full", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.RANK_UP, 91), row(K.RANK_UP, 92)] },
      { at: T + 100, rows: [row(K.TOOK_LEAD, 93)] },
      { at: T + 200, rows: [row(K.TURBO_SUCCESS, 94)] },
      { at: T + 300, rows: [row(K.SAFE_PERFECT, 93)] },
      { at: T + 350, rows: [row(K.LUCK_SHIELD_BLOCKED, 93)] },
      { at: T + 400, rows: [row(K.PLAYER_FINISHED, 91)] },
      { at: T + 500, rows: [row(K.RACE_FINISHED)] },
    ])).toEqual([
      ["RANK_UP:91", "RANK_UP:92"],
      ["TOOK_LEAD:93"],
      ["TURBO_SUCCESS:94"],
      ["SAFE_PERFECT:93"],
      ["LUCK_SHIELD_BLOCKED:93"],
      ["PLAYER_FINISHED:91"],
      ["RACE_FINISHED:race"],
    ]);
  });

  // Found live: two students neck and neck swapped the lead every few seconds, and 41 lead rows filled the feed.
  it("tells a new leader at most once in ten seconds for the class, so a lead that flips is not news each time", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.TOOK_LEAD, 91)] },
      { at: T + 3_000, rows: [row(K.TOOK_LEAD, 92)] },
      { at: T + 6_000, rows: [row(K.TOOK_LEAD, 91)] },
      { at: T + 9_999, rows: [row(K.TOOK_LEAD, 92)] },
      { at: T + 10_000, rows: [row(K.TOOK_LEAD, 92)] },
    ])).toEqual([["TOOK_LEAD:91"], [], [], [], ["TOOK_LEAD:92"]]);
  });

  it("lets a student's other news through when that student's lead is held back", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.TOOK_LEAD, 91)] },
      { at: T + 3_000, rows: [row(K.TOOK_LEAD, 92), row(K.STREAK, 92)] },
    ])).toEqual([["TOOK_LEAD:91"], ["STREAK:92"]]);
  });

  it("lets at most two medium or low rows through for the whole class in five seconds", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.RANK_UP, 91), row(K.RANK_UP, 92), row(K.RANK_UP, 93)] },
      { at: T + 4_999, rows: [row(K.SHIELD_EARNED, 94)] },
      { at: T + 5_000, rows: [row(K.SHIELD_EARNED, 94)] },
    ])).toEqual([["RANK_UP:91", "RANK_UP:92"], [], ["SHIELD_EARNED:94"]]);
  });

  // Found live: plain correct answers came first, filled both places and starved the Luck, streak and climb rows.
  it("lets a plain correct answer take only one of the two places, so a busy class still sees its other news", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.CORRECT_ANSWER, 91), row(K.CORRECT_ANSWER, 92)] },
      { at: T + 100, rows: [row(K.CORRECT_ANSWER, 93)] },
      { at: T + 200, rows: [row(K.LUCK_TAILWIND, 94)] },
      { at: T + 5_000, rows: [row(K.CORRECT_ANSWER, 92)] },
    ])).toEqual([["CORRECT_ANSWER:91"], [], ["LUCK_TAILWIND:94"], ["CORRECT_ANSWER:92"]]);
  });

  it("gives a student one quiet row in four seconds", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.LUCK_TAILWIND, 91)] },
      { at: T + 3_999, rows: [row(K.RANK_UP, 91)] },
      { at: T + 4_000, rows: [row(K.RANK_UP, 91)] },
    ])).toEqual([["LUCK_TAILWIND:91"], [], ["RANK_UP:91"]]);
  });

  // Found live: a student's frequent lead rows used to start that student's quiet gap and starve their Luck news.
  it("never lets a student's top or high row hold back that student's quieter news", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.TOOK_LEAD, 91)] },
      { at: T + 1_000, rows: [row(K.LUCK_MUD, 91)] },
    ])).toEqual([["TOOK_LEAD:91"], ["LUCK_MUD:91"]]);
  });

  it("remembers only the rows it showed", () => {
    expect(admitInTurn([
      { at: T, rows: [row(K.RANK_UP, 91), row(K.RANK_UP, 92)] },
      { at: T + 2_000, rows: [row(K.RANK_UP, 93)] },
      { at: T + 5_000, rows: [row(K.RANK_UP, 93)] },
    ])).toEqual([["RANK_UP:91", "RANK_UP:92"], [], ["RANK_UP:93"]]);
  });

  it("shows nothing from an event older than the replay limit and remembers nothing of it", () => {
    const late = admitFeedItems(EMPTY_FEED_ADMISSION, [row(K.RACE_FINISHED)], {
      occurredAtEpochMs: T,
      eventAgeMs: replayTtlMs + 1,
    });
    expect(late).toEqual({ admitted: [], memory: EMPTY_FEED_ADMISSION });
    expect(late.memory).toBe(EMPTY_FEED_ADMISSION);

    expect(admitInTurn([
      { at: T, rows: [row(K.TOOK_LEAD, 91)], ageMs: replayTtlMs },
      { at: T + 10_000, rows: [row(K.CORRECT_ANSWER, 92)], ageMs: -250 },
    ])).toEqual([["TOOK_LEAD:91"], ["CORRECT_ANSWER:92"]]);
  });

  it("keeps its memory small however long the race runs", () => {
    let memory = EMPTY_FEED_ADMISSION;

    for (let second = 0; second < 600; second += 1) {
      const studentId = 91 + (second % 8);
      memory = admitFeedItems(memory, [row(K.CORRECT_ANSWER, studentId)], {
        occurredAtEpochMs: T + second * 1_000,
        eventAgeMs: 0,
      }).memory;
    }

    expect(memory.windowAdmissions.length).toBeLessThanOrEqual(lowPriorityPerWindow);
    expect(memory.lowestAdmissions.length).toBeLessThanOrEqual(lowPriorityPerWindow);
    expect(Object.keys(memory.lastAdmittedAtByPlayer).length).toBeLessThanOrEqual(lowPriorityPerWindow);
  });

  it("re-anchors on a server clock that steps back, so the window neither opens nor freezes", () => {
    const hourEarlier = T - 3_600_000;

    expect(admitInTurn([
      { at: T, rows: [row(K.RANK_UP, 91), row(K.RANK_UP, 92)] },
      { at: hourEarlier, rows: [row(K.RANK_UP, 93)] },
      { at: hourEarlier + 5_000, rows: [row(K.RANK_UP, 93)] },
    ])).toEqual([["RANK_UP:91", "RANK_UP:92"], [], ["RANK_UP:93"]]);
  });
});
