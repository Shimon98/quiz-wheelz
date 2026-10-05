import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { playStudentRaceMoments } from "../../audio/studentRaceSounds";
import { createPixiStudentRaceApp } from "../../pixi/createPixiStudentRaceApp";
import { StudentRaceRenderer } from "../../pixi/StudentRaceRenderer";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import { STUDENT_RACE_FEEDBACK } from "../../runtime/studentRaceRuntimeConstants";
import StudentRaceScreen from "../StudentRaceScreen";

vi.mock("../../pixi/createPixiStudentRaceApp", () => ({ createPixiStudentRaceApp: vi.fn() }));
vi.mock("../../pixi/StudentRaceRenderer", () => ({ StudentRaceRenderer: vi.fn() }));
vi.mock("../../pixi/utils/pixiResize", () => ({ observeMountResize: () => () => {} }));
vi.mock("../../pixi/utils/pixiCleanup", () => ({ destroyPixiStudentRace: () => {} }));
vi.mock("../../audio/studentRaceSounds", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, playStudentRaceMoments: vi.fn(actual.playStudentRaceMoments) };
});

const ACCEPTED_FEEDBACK = Object.freeze({ questionId: 17, correct: true, scoreDelta: 10, streak: 1 });

function race(runtimeState, feedback = null) {
  return (
    <MantineProvider env="test">
      <StudentRaceScreen
        runtimeState={runtimeState}
        answerFeedback={feedback}
        feedbackState={feedback ? STUDENT_RACE_FEEDBACK.CORRECT : STUDENT_RACE_FEEDBACK.IDLE}
      />
    </MantineProvider>
  );
}

let renderer;
let resolvePixiApp;

beforeEach(() => {
  renderer = { playMoments: vi.fn(), updateRuntimeState: vi.fn(), updateFinishPresentation: vi.fn() };
  createPixiStudentRaceApp.mockReturnValue(new Promise((resolve) => {
    resolvePixiApp = resolve;
  }));
  StudentRaceRenderer.mockImplementation(function FakeRenderer() {
    return renderer;
  });
  vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const batchesOf = (mock) => mock.mock.calls.map(([batch]) => batch);

describe("StudentRaceScreen moments while Pixi starts", () => {
  it("hands moments that arrive before the renderer exists to it once it is ready, as the batches the sound got", async () => {
    const runtime = createInitialRaceRuntimeState();
    const { rerender } = render(race(runtime));

    rerender(race(runtime, ACCEPTED_FEEDBACK));
    rerender(race({ ...runtime, playerFinished: true }, ACCEPTED_FEEDBACK));
    expect(audioEngine.playSfx.mock.calls).toEqual([[GAME_AUDIO.ANSWER_CORRECT], [GAME_AUDIO.RACE_FINISH]]);
    expect(renderer.playMoments).not.toHaveBeenCalled();
    await act(async () => resolvePixiApp({}));

    const soundBatches = batchesOf(playStudentRaceMoments);
    expect(soundBatches).toHaveLength(2);
    batchesOf(renderer.playMoments).forEach((batch, index) => expect(batch).toBe(soundBatches[index]));
    expect(renderer.playMoments).toHaveBeenCalledTimes(2);
  });

  it("delivers later moments straight to the ready renderer and never replays the held ones", async () => {
    const runtime = createInitialRaceRuntimeState();
    const { rerender } = render(race(runtime));
    rerender(race(runtime, ACCEPTED_FEEDBACK));
    await act(async () => resolvePixiApp({}));

    rerender(race({ ...runtime }, ACCEPTED_FEEDBACK));
    rerender(race(runtime, { ...ACCEPTED_FEEDBACK, questionId: 18 }));

    expect(batchesOf(renderer.playMoments).map(({ moments }) => moments.map(({ id }) => id))).toEqual([[17], [18]]);
  });
});
