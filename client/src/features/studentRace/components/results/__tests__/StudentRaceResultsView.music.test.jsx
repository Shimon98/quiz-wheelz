import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import { audioEngine } from "../../../../../shared/audio";
import { FakeAudioContext } from "../../../../../shared/audio/audioTestFakes";
import { GAME_AUDIO, GAME_AUDIO_MANIFEST } from "../../../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_GAME_MUSIC_GAIN } from "../../../../studentJoin/config/studentJoinConfig";
import { STUDENT_RACE_SOUND } from "../../../audio/studentRaceSounds";
import useStudentRaceSound from "../../../hooks/useStudentRaceSound";
import { resultsRuntime } from "../../../runtime/studentRaceResultsTestFixtures";
import { buildStudentRaceResultsViewModel } from "../../../utils/buildStudentRaceResultsViewModel";
import StudentRaceResultsView from "../StudentRaceResultsView";

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

function RaceScene() {
  useStudentRaceSound({ engineActive: false, speed: 1 });
  return null;
}

function Screen({ phase }) {
  return (
    <MantineProvider>
      <MemoryRouter>
        {phase === "race" ? <RaceScene /> : <StudentRaceResultsView model={buildStudentRaceResultsViewModel(resultsRuntime(), null)} />}
      </MemoryRouter>
    </MantineProvider>
  );
}

describe("StudentRaceResultsView music", () => {
  it("plays the game music softer than the waiting room while the results show, and releases it on exit", () => {
    const claim = vi.spyOn(audioEngine, "claimMusic");
    const release = vi.spyOn(audioEngine, "releaseMusic");
    const { unmount } = render(<Screen phase="results" />);

    expect(claim).toHaveBeenCalledExactlyOnceWith(GAME_AUDIO.MUSIC_GAME, { gain: STUDENT_RACE_SOUND.resultsMusicGain });
    expect(STUDENT_RACE_SOUND.resultsMusicGain).toBeLessThan(STUDENT_GAME_MUSIC_GAIN);
    unmount();

    expect(release).toHaveBeenCalledExactlyOnceWith(claim.mock.results[0].value);
  });

  it("takes the music over from the race screen on the same route and leaves none behind", () => {
    const { rerender, unmount } = render(<Screen phase="race" />);
    expect(audioEngine.getState().music).toBe(GAME_AUDIO.MUSIC_RACE);

    rerender(<Screen phase="results" />);
    expect(audioEngine.getState().music).toBe(GAME_AUDIO.MUSIC_GAME);

    unmount();
    expect(audioEngine.getState().music).toBeNull();
  });

  it("stays silent while Music is off and plays once the student switches it on", async () => {
    render(<Screen phase="results" />);
    await audioEngine.unlock();
    const [musicBus] = contexts[0].gains;

    audioEngine.configure({ musicEnabled: false });
    expect(musicBus.gain.value).toBe(0);
    expect(audioEngine.getState().music).toBe(GAME_AUDIO.MUSIC_GAME);

    audioEngine.configure({ musicEnabled: true });
    expect(musicBus.gain.value).toBeGreaterThan(0);
  });
});
