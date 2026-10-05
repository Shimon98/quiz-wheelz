import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { AUDIO_LOOP_CHANNELS, audioEngine } from "../../../../shared/audio";
import { FakeAudioContext } from "../../../../shared/audio/audioTestFakes";
import { GAME_AUDIO, GAME_AUDIO_MANIFEST } from "../../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_RACE_SOUND } from "../../audio/studentRaceSounds";
import useStudentRaceSound from "../useStudentRaceSound";

function Race({ engineActive = true, speed = 0.5 }) {
  useStudentRaceSound({ engineActive, speed });
  return null;
}

let contexts;

beforeEach(() => {
  contexts = [];
  vi.stubGlobal("AudioContext", class extends FakeAudioContext {
    constructor() {
      super();
      contexts.push(this);
    }
  });
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
  audioEngine.register(GAME_AUDIO_MANIFEST);
});

afterEach(() => {
  audioEngine.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useStudentRaceSound", () => {
  it("claims the soft student race music and preloads the race sounds", () => {
    const claim = vi.spyOn(audioEngine, "claimMusic");
    const preload = vi.spyOn(audioEngine, "preload");

    render(<Race />);

    expect(claim).toHaveBeenCalledWith(GAME_AUDIO.MUSIC_RACE, { gain: STUDENT_RACE_SOUND.raceMusicGain });
    expect(preload).toHaveBeenCalledWith(STUDENT_RACE_SOUND.preloadKeys);
  });

  it("runs the engine only while racing, follows the speed without restarting and stops on finish or exit", () => {
    const start = vi.spyOn(audioEngine, "startLoop");
    const stop = vi.spyOn(audioEngine, "stopLoop");
    const { rerender, unmount } = render(<Race speed={0.5} />);

    expect(start).toHaveBeenLastCalledWith(AUDIO_LOOP_CHANNELS.ENGINE, GAME_AUDIO.HOVER_ENGINE, { rate: 0.8 });
    rerender(<Race speed={2} />);
    expect(start.mock.lastCall[2].rate).toBeCloseTo(1.4);
    expect(stop).not.toHaveBeenCalled();
    rerender(<Race engineActive={false} speed={2} />);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(audioEngine.getState().loops).toEqual({});
    rerender(<Race speed={1.25} />);
    unmount();

    expect(start).toHaveBeenCalledTimes(3);
    expect(stop).toHaveBeenCalledTimes(2);
    expect(audioEngine.getState().loops).toEqual({});
  });

  it("keeps the race scene while Music or SFX is off and brings both back when switched on", async () => {
    render(<Race />);
    await audioEngine.unlock();
    const [musicBus, sfxBus] = contexts[0].gains;

    audioEngine.configure({ musicEnabled: false, sfxEnabled: false });
    expect(audioEngine.getState()).toMatchObject({
      music: GAME_AUDIO.MUSIC_RACE,
      loops: { [AUDIO_LOOP_CHANNELS.ENGINE]: GAME_AUDIO.HOVER_ENGINE },
    });
    expect([musicBus.gain.value, sfxBus.gain.value]).toEqual([0, 0]);
    audioEngine.configure({ musicEnabled: true, sfxEnabled: true });

    expect(musicBus.gain.value).toBeGreaterThan(0);
    expect(sfxBus.gain.value).toBeGreaterThan(0);
    expect(audioEngine.getState().music).toBe(GAME_AUDIO.MUSIC_RACE);
  });
});
