import { describe, expect, it } from "vitest";

import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { TEACHER_FEED_KINDS } from "../../config/teacherLiveFeedConfig";
import { soundForFreshFeedItems } from "../teacherRaceSounds";

const item = (kind, id = kind) => ({ id, kind });

describe("teacher projector sounds", () => {
  it("stays silent for answers and rank changes", () => {
    expect(soundForFreshFeedItems([item(TEACHER_FEED_KINDS.CORRECT_ANSWER), item(TEACHER_FEED_KINDS.RANK_UP)])).toBeNull();
    expect(soundForFreshFeedItems([])).toBeNull();
  });

  it("plays one soft cue for any number of finishers in one refresh", () => {
    expect(soundForFreshFeedItems([
      item(TEACHER_FEED_KINDS.PLAYER_FINISHED, "a"),
      item(TEACHER_FEED_KINDS.RANK_UP),
      item(TEACHER_FEED_KINDS.PLAYER_FINISHED, "b"),
    ])).toBe(GAME_AUDIO.PROJECTOR_PLAYER_FINISHED);
  });

  it("lets the race-finished cue win over the last finisher", () => {
    expect(soundForFreshFeedItems([
      item(TEACHER_FEED_KINDS.RACE_FINISHED),
      item(TEACHER_FEED_KINDS.PLAYER_FINISHED),
    ])).toBe(GAME_AUDIO.PROJECTOR_RACE_FINISHED);
  });

  it("adds no cue for leads, streaks or public moments: the student's own screen already plays those", () => {
    const quietKinds = Object.values(TEACHER_FEED_KINDS).filter(
      (kind) => kind !== TEACHER_FEED_KINDS.PLAYER_FINISHED && kind !== TEACHER_FEED_KINDS.RACE_FINISHED,
    );

    expect(soundForFreshFeedItems(quietKinds.map((kind) => item(kind)))).toBeNull();
  });
});
