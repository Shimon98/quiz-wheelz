import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { TEACHER_RACE_SOUND } from "../../audio/teacherRaceSounds";
import useTeacherRoomSound from "../useTeacherRoomSound";

function Room({ players }) {
  useTeacherRoomSound(players);
  return null;
}

const roomPlayer = (playerId, displayName = `P${playerId}`) => ({
  playerId,
  displayName,
  laneNumber: playerId,
  vehicleAssetKey: "TOY_CAR_GREEN",
  status: "WAITING",
});
const roster = (...ids) => ids.map((playerId) => roomPlayer(playerId));

let play;
let claim;

beforeEach(() => {
  play = vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");
  claim = vi.spyOn(audioEngine, "claimMusic").mockReturnValue(1);
  vi.spyOn(audioEngine, "releaseMusic").mockImplementation(() => {});
  vi.spyOn(audioEngine, "preload").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTeacherRoomSound", () => {
  it("plays the game music in the waiting room", () => {
    render(<Room players={null} />);

    expect(claim).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.MUSIC_GAME, { gain: TEACHER_RACE_SOUND.roomMusicGain });
  });

  it("pops once per roster refresh that brings new players, never for the first roster or a repeat", () => {
    const { rerender } = render(<Room players={null} />);

    rerender(<Room players={roster(1, 2)} />);
    rerender(<Room players={roster(1, 2)} />);
    rerender(<Room players={roster(1, 2, 3, 4, 5)} />);
    rerender(<Room players={roster(1, 2, 3, 4)} />);

    expect(play.mock.calls).toEqual([[GAME_AUDIO.PROJECTOR_PLAYER_JOINED]]);
  });

  it("knows players by the room's playerId, so a newcomer who takes a freed name still pops", () => {
    const { rerender } = render(<Room players={[roomPlayer(1, "Noa")]} />);

    rerender(<Room players={[roomPlayer(2, "Noa")]} />);

    expect(play.mock.calls).toEqual([[GAME_AUDIO.PROJECTOR_PLAYER_JOINED]]);
  });

  it("never pops for a roster entry that has no playerId", () => {
    const { rerender } = render(<Room players={roster(1)} />);

    rerender(<Room players={[...roster(1), { displayName: "Ghost" }]} />);

    expect(play).not.toHaveBeenCalled();
  });
});
