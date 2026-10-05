import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { TEACHER_RACE_SOUND } from "../../audio/teacherRaceSounds";
import { TEACHER_FEED_KINDS } from "../../config/teacherLiveFeedConfig";
import { mapTeacherLiveEventEnvelope } from "../../runtime/liveEvents/mapTeacherLiveEventEnvelope";
import { mapTeacherRaceLiveState } from "../../runtime/mapTeacherRaceLiveState";
import {
  INITIAL_TEACHER_LIVE_STATE,
  TEACHER_LIVE_ACTIONS,
  teacherRaceLiveReducer,
} from "../../runtime/teacherRaceLiveReducer";
import {
  teacherLiveEvent,
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../runtime/teacherRaceLiveTestFixtures";
import useTeacherLiveRaceSound from "../useTeacherLiveRaceSound";

function Projector({ raceRunning = true, recentEvents = [] }) {
  useTeacherLiveRaceSound({ raceRunning, recentEvents });
  return null;
}

const feedItem = (id, kind) => ({ id, kind });

let play;
let claim;
let release;

beforeEach(() => {
  play = vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");
  claim = vi.spyOn(audioEngine, "claimMusic").mockReturnValue(1);
  release = vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});
  vi.spyOn(audioEngine, "preload").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTeacherLiveRaceSound", () => {
  it("plays the race music at the projector level only while the race runs", () => {
    const { rerender } = render(<Projector raceRunning />);
    expect(claim).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.MUSIC_RACE, { gain: TEACHER_RACE_SOUND.raceMusicGain });

    rerender(<Projector raceRunning={false} />);

    expect(release).toHaveBeenCalledWith(1);
    expect(claim).toHaveBeenCalledTimes(1);
  });

  it("never replays the feed already on screen when the projector opens", () => {
    render(<Projector recentEvents={[feedItem("9:RACE_FINISHED:race", TEACHER_FEED_KINDS.RACE_FINISHED)]} />);

    expect(play).not.toHaveBeenCalled();
  });

  it("cues fresh finishes once and ignores answers and rank changes", () => {
    const answer = feedItem("1:CORRECT_ANSWER:a", TEACHER_FEED_KINDS.CORRECT_ANSWER);
    const rankUp = feedItem("2:RANK_UP:a", TEACHER_FEED_KINDS.RANK_UP);
    const finish = feedItem("3:PLAYER_FINISHED:a", TEACHER_FEED_KINDS.PLAYER_FINISHED);
    const end = feedItem("4:RACE_FINISHED:race", TEACHER_FEED_KINDS.RACE_FINISHED);
    const { rerender } = render(<Projector recentEvents={[answer]} />);

    rerender(<Projector recentEvents={[rankUp, answer]} />);
    rerender(<Projector recentEvents={[finish, rankUp, answer]} />);
    rerender(<Projector recentEvents={[finish, rankUp, answer]} />);
    rerender(<Projector raceRunning={false} recentEvents={[end, finish, rankUp, answer]} />);

    expect(play.mock.calls).toEqual([[GAME_AUDIO.PROJECTOR_PLAYER_FINISHED], [GAME_AUDIO.PROJECTOR_RACE_FINISHED]]);
  });

  it("follows the real projector start-up: hydration never fills the feed, so only events after the load sound", () => {
    const loadState = (state, overrides) => teacherRaceLiveReducer(state, {
      type: TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED,
      raceId: "7",
      runtime: mapTeacherRaceLiveState(teacherLiveStateResponse(overrides)),
      receivedAtPerformanceNow: 1,
    });
    const finishedNoa = teacherLivePlayer({ status: "FINISHED", position: 1000 });
    const dan = teacherLivePlayer({ racePlayerId: 92, displayName: "Dan", laneNumber: 2, rank: 2, position: 95 });
    const { rerender } = render(<Projector recentEvents={INITIAL_TEACHER_LIVE_STATE.recentEvents} />);

    const hydrated = loadState(INITIAL_TEACHER_LIVE_STATE, { players: [finishedNoa, dan] });
    expect(hydrated.recentEvents).toEqual([]);
    rerender(<Projector recentEvents={hydrated.recentEvents} />);
    const live = teacherRaceLiveReducer(hydrated, {
      type: TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED,
      event: mapTeacherLiveEventEnvelope(teacherLiveEvent({
        version: 13,
        type: "PLAYER_FINISHED",
        payload: { player: { ...dan, status: "FINISHED", position: 1000 }, finishedAtEpochMs: 1_755_600_002_000, players: [finishedNoa, { ...dan, status: "FINISHED", position: 1000 }] },
      })),
    });
    rerender(<Projector recentEvents={live.recentEvents} />);
    const recovered = loadState(live, { eventVersion: 30 });
    rerender(<Projector recentEvents={recovered.recentEvents} />);

    expect(recovered.recentEvents).toBe(live.recentEvents);
    expect(play.mock.calls).toEqual([[GAME_AUDIO.PROJECTOR_PLAYER_FINISHED]]);
  });
});
