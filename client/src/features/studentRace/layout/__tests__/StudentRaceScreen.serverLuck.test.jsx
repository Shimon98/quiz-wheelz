import { act, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "../../../../i18n/i18n";
import { audioEngine } from "../../../../shared/audio";
import { GAME_AUDIO } from "../../../../shared/gameAudio/gameAudioCatalog";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { createPixiStudentRaceApp } from "../../pixi/createPixiStudentRaceApp";
import { applyRaceSnapshot } from "../../runtime/applyRaceSnapshot";
import { createInitialRaceRuntimeState } from "../../runtime/createInitialRaceRuntimeState";
import { SERVER_LUCK_SNAPSHOTS } from "../../runtime/serverLuckTestFixtures";
import { STUDENT_RACE_FEEDBACK, STUDENT_RACE_MOMENT } from "../../runtime/studentRaceRuntimeConstants";
import StudentRaceScreen from "../StudentRaceScreen";

// Each Luck type on what the server really sends (SERVER_LUCK_SNAPSHOTS), through the production mapper, the moments
// pipeline, the screen and the real Pixi layers.
const {
  TAILWIND: tailwind,
  ORB: orb,
  MUD: mud,
  BLOCKED: blocked,
  SHIELD: shield,
  TWO_EVENTS: twoEvents,
  TAILWIND_EXPIRED: tailwindExpired,
  MUD_EXPIRED: mudExpired,
} = SERVER_LUCK_SNAPSHOTS;

vi.mock("../../pixi/createPixiStudentRaceApp", () => ({ createPixiStudentRaceApp: vi.fn() }));
vi.mock("../../pixi/utils/pixiResize", () => ({ observeMountResize: () => () => {} }));
vi.mock("../../pixi/utils/pixiCleanup", () => ({ destroyPixiStudentRace: () => {} }));
vi.mock("../../pixi/assets/studentRaceWorldAssets", async (importOriginal) => {
  const actual = await importOriginal();
  const { Texture, TextureSource } = await import("pixi.js");
  return {
    ...actual,
    loadStudentRaceWorldTexture: async () => ({
      status: actual.WORLD_ASSET_STATUS.LOADED,
      texture: new Texture({ source: new TextureSource({ width: 400, height: 512 }) }),
    }),
  };
});
vi.mock("../../pixi/assets/studentRaceVehicleAssets", async (importOriginal) => ({
  ...await importOriginal(),
  loadStudentRaceVehicleAssets: async (vehicleAssetKey) => ({ status: "fallback", vehicleAssetKey }),
}));

const LUCK_MOMENTS = new Set([
  STUDENT_RACE_MOMENT.LUCK_TAILWIND,
  STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB,
  STUDENT_RACE_MOMENT.LUCK_MUD,
  STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED,
]);
const ACCEPTED_ANSWER = Object.freeze({ questionId: 17, correct: true, scoreDelta: 10, streak: 1 });

let question;

function joinedRace(racePlayerId = 1) {
  const state = createInitialRaceRuntimeState();
  return {
    ...state,
    race: { ...state.race, id: 7 },
    player: { ...state.player, racePlayerId, vehicleAssetKey: "TOY_CAR_GREEN" },
  };
}

// receivedAgoMs: how long ago the snapshot arrived, e.g. a refresh a moment after the server decided.
function withSnapshot(snapshot, { from = joinedRace(), receivedAgoMs = 0 } = {}) {
  return applyRaceSnapshot(from, snapshot, Date.now() - receivedAgoMs);
}

function raceScreen(runtimeState, answerFeedback = null) {
  return (
    <MantineProvider env="test">
      <StudentRaceScreen
        runtimeState={runtimeState}
        question={question}
        answerFeedback={answerFeedback}
        feedbackState={answerFeedback ? STUDENT_RACE_FEEDBACK.CORRECT : STUDENT_RACE_FEEDBACK.IDLE}
        interactionEnabled
      />
    </MantineProvider>
  );
}

async function mount(runtimeState) {
  const view = render(raceScreen(runtimeState));
  await act(async () => {});
  const renderer = window.__studentRaceRenderer;
  await act(async () => renderer.ready);
  return { ...view, renderer, played: vi.spyOn(renderer, "playMoments") };
}

// The answer response carries the snapshot, then the feedback dwell ends and the next question's line shows.
async function answerArrives(snapshot, before = joinedRace()) {
  const view = await mount(before);
  const after = withSnapshot(snapshot, { from: before });
  view.rerender(raceScreen(after, ACCEPTED_ANSWER));
  view.rerender(raceScreen(after));
  return { ...view, after };
}

const LUCK_CUES = new Set([GAME_AUDIO.LUCK_TAILWIND, GAME_AUDIO.LUCK_ENERGY_ORB, GAME_AUDIO.LUCK_MUD,
  GAME_AUDIO.LUCK_SHIELD_BLOCKED]);
const luckCuesPlayed = () => audioEngine.playSfx.mock.calls.map(([key]) => key).filter((key) => LUCK_CUES.has(key));

const luckMomentsPlayed = ({ played }) => played.mock.calls
  .flatMap(([batch]) => batch.moments.map(({ type }) => type))
  .filter((type) => LUCK_MOMENTS.has(type));

// One frame past the Mud blobs' landing, when the puddle has burst up behind the kart; every Luck burst still plays.
const FRAME_MS = STUDENT_RACE_ANIMATION_CONFIG.effects.luckMudLandedMs + 16;

function pixiFrame(renderer) {
  renderer.tick({ deltaMS: FRAME_MS, elapsedMS: FRAME_MS });
  const { shield: bubble, wind, mud: puddle } = renderer.playerKartLayer.luckMarks;
  return {
    shield: bubble.visible,
    wind: wind.visible,
    mud: puddle.visible,
    luckEffects: [...renderer.effectsLayer.activeEffects.keys()].filter((type) => LUCK_MOMENTS.has(type)),
  };
}

const text = (key) => i18n.t(`studentRace:${key}`);
const shieldLine = (container) => container.querySelector(".student-race-hud > [aria-live='polite']");
const luckLine = (container) => container.querySelector(".race-luck-notice");
const NO_MARKS = Object.freeze({ shield: false, wind: false, mud: false });

beforeEach(() => {
  question = {
    id: 18, gameplayContext: "NORMAL", text: "6 × 7 = ?", timeLimitSeconds: 20,
    expiresAtEpochMs: Date.now() + 15_000, serverClockOffsetMs: 0,
    choices: [{ id: 1, text: "42" }, { id: 2, text: "36" }],
  };
  createPixiStudentRaceApp.mockImplementation(async () => {
    const { Container } = await import("pixi.js");
    return { screen: { width: 520, height: 800 }, stage: new Container(), ticker: { add: vi.fn(), remove: vi.fn() } };
  });
  vi.spyOn(audioEngine, "playSfx").mockReturnValue("played");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StudentRaceScreen with the server's own Luck snapshots", () => {
  it.each([
    ["a Tailwind", tailwind, [STUDENT_RACE_MOMENT.LUCK_TAILWIND], "gameplay.luck.tailwind", { wind: true },
      [GAME_AUDIO.LUCK_TAILWIND]],
    ["an Energy Orb", orb, [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB], "gameplay.luck.energyOrb", {},
      [GAME_AUDIO.LUCK_ENERGY_ORB]],
    ["a Mud Splash", mud, [STUDENT_RACE_MOMENT.LUCK_MUD], "gameplay.luck.mud", { mud: true }, [GAME_AUDIO.LUCK_MUD]],
    ["two events in one snapshot", twoEvents, [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, STUDENT_RACE_MOMENT.LUCK_MUD],
      "gameplay.luck.mud", { mud: true }, [GAME_AUDIO.LUCK_ENERGY_ORB, GAME_AUDIO.LUCK_MUD]],
  ])("plays, sounds and tells %s that arrives with an answer, once", async (_, snapshot, moments, noticeKey, marks,
    cues) => {
    const view = await answerArrives(snapshot);

    expect(luckMomentsPlayed(view)).toEqual(moments);
    expect(luckCuesPlayed()).toEqual(cues);
    expect(pixiFrame(view.renderer)).toEqual({ ...NO_MARKS, ...marks, luckEffects: moments });
    expect(screen.getByText(text(noticeKey))).toBeInTheDocument();

    // A reconnect hands the same server state back, and a stale sample can come in between: nothing plays again.
    view.rerender(raceScreen({ ...view.after }));
    view.rerender(raceScreen(joinedRace()));
    view.rerender(raceScreen({ ...view.after }));
    expect(luckMomentsPlayed(view)).toEqual(moments);
    expect(luckCuesPlayed()).toEqual(cues);
  });

  it("raises the shield from the server award, tells screen readers, and drops both once it blocks the mud", async () => {
    const shieldUp = withSnapshot(shield);
    const view = await answerArrives(blocked, shieldUp);

    expect(luckMomentsPlayed(view)).toEqual([STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED]);
    expect(luckCuesPlayed()).toEqual([GAME_AUDIO.LUCK_SHIELD_BLOCKED]);
    expect(pixiFrame(view.renderer)).toEqual({ ...NO_MARKS, luckEffects: [STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED] });
    expect(screen.getByText(text("gameplay.luck.shieldBlocked"))).toBeInTheDocument();
    expect(shieldLine(view.container)).toBeEmptyDOMElement();
  });

  it("shows a fresh shield on the kart and in the screen-reader line", async () => {
    const view = await mount(withSnapshot(shield));

    expect(pixiFrame(view.renderer)).toEqual({ ...NO_MARKS, shield: true, luckEffects: [] });
    expect(shieldLine(view.container)).toHaveTextContent(text("hud.shieldReady"));
  });

  it.each([
    ["a Tailwind window still open", tailwind, "gameplay.luck.tailwind", { wind: true }],
    ["a Mud window still open", mud, "gameplay.luck.mud", { mud: true }],
    ["an Energy Orb", orb, null, {}],
    ["a Mud Splash the shield blocked", blocked, null, {}],
    ["two events with the Mud window still open", twoEvents, "gameplay.luck.mud", { mud: true }],
    ["a Tailwind window already closed", tailwindExpired, null, {}],
    ["a Mud window already closed", mudExpired, null, {}],
  ])("after a refresh 1.5 s later, keeps only what still lasts of %s", async (_, snapshot, noticeKey, marks) => {
    const view = await mount(withSnapshot(snapshot, { receivedAgoMs: 1_500 }));

    expect(pixiFrame(view.renderer)).toEqual({ ...NO_MARKS, ...marks, luckEffects: [] });
    if (noticeKey == null) expect(luckLine(view.container)).toBeNull();
    else expect(luckLine(view.container)).toHaveTextContent(text(noticeKey));
    expect(screen.getByText(text("question.instruction"))).toBeInTheDocument();
    expect(luckMomentsPlayed(view)).toEqual([]);
    expect(luckCuesPlayed()).toEqual([]);
  });

  it("tells a student the screen has just started racing as nothing that happened before", async () => {
    const view = await answerArrives(orb);
    expect(screen.getByText(text("gameplay.luck.energyOrb"))).toBeInTheDocument();

    // The browser now races as another student, whose own fresh shield block the screen never saw arrive.
    view.rerender(raceScreen(withSnapshot(blocked, { from: joinedRace(2) })));

    expect(luckMomentsPlayed(view)).toEqual([STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB]);
    expect(luckLine(view.container)).toBeNull();
    expect(screen.getByText(text("question.instruction"))).toBeInTheDocument();
  });
});
// C5-05: a climb in place, on the server's own snapshots, shares the Luck line and never adds a sound.
describe("StudentRaceScreen rank news on the server's snapshots", () => {
  const quiet = (snapshot) => ({
    ...snapshot,
    gameplay: { ...snapshot.gameplay, activeEffects: [], luck: { recentEvents: [] } },
  });
  const placed = (snapshot, rank, { earlierMs = 0 } = {}) => ({
    ...snapshot,
    rank,
    playerCount: 3,
    snapshotAtEpochMs: snapshot.snapshotAtEpochMs - earlierMs,
    eventVersion: earlierMs > 0 ? 1 : snapshot.eventVersion,
  });
  const climbText = (rank) => i18n.t("studentRace:gameplay.rank.up", { rank });
  const pulsingTile = (container) => container.querySelector("[data-rank-pulse='true']");

  async function climbTo(after) {
    const before = withSnapshot(placed(quiet(orb), 3, { earlierMs: 2_000 }));
    const view = await mount(before);
    const climbed = withSnapshot(after, { from: before });
    view.rerender(raceScreen(climbed));
    return { ...view, climbed };
  }

  it("tells a climb once on the notice line, pulses the place tile and plays no sound for it", async () => {
    const view = await climbTo(placed(quiet(orb), 2));

    expect(luckLine(view.container)).toHaveTextContent(climbText(2));
    expect(pulsingTile(view.container)).not.toBeNull();
    expect(audioEngine.playSfx).not.toHaveBeenCalled();

    view.rerender(raceScreen({ ...view.climbed }));
    expect(view.played.mock.calls.flatMap(([batch]) => batch.moments.map(({ type }) => type)))
      .toEqual([STUDENT_RACE_MOMENT.RANK_UP]);
  });

  it("lets a Tailwind that came with the climb hold the line", async () => {
    const view = await climbTo(placed(tailwind, 2));

    expect(luckLine(view.container)).toHaveTextContent(text("gameplay.luck.tailwind"));
    expect(screen.queryByText(climbText(2))).toBeNull();
  });

  it("tells nothing about the place when the climb is the finish", async () => {
    const view = await climbTo({
      ...placed(quiet(orb), 1),
      playerFinished: true,
      playerStatus: "FINISHED",
      playerFinishedAtEpochMs: orb.snapshotAtEpochMs,
    });

    expect(luckLine(view.container)).toBeNull();
    expect(pulsingTile(view.container)).toBeNull();
  });
});
