import { Container, Texture, TextureSource } from "pixi.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_EFFECT, STUDENT_RACE_MOMENT } from "../../../runtime/studentRaceRuntimeConstants";
import { EffectsLayer } from "../EffectsLayer";

// Every Luck slot as it will look once its approved file exists.
vi.mock("../../assets/studentRaceEffectManifest", async (importOriginal) => {
  const actual = await importOriginal();
  const withFile = (slot) => ({ ...actual.LUCK_EFFECT_ART[slot], url: `${slot}.webp` });
  return {
    ...actual,
    LUCK_EFFECT_ART: Object.fromEntries(Object.keys(actual.LUCK_EFFECT_ART).map((slot) => [slot, withFile(slot)])),
  };
});

const BURST_ART = [
  [STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, "energyOrb", 120],
  [STUDENT_RACE_MOMENT.LUCK_TAILWIND, "windLeaf", 180],
  [STUDENT_RACE_MOMENT.LUCK_MUD, "mudDrop", 40],
  [STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED, "shieldImpact", 130],
];

function frame({ deltaMs = 16, reducedMotion = false } = {}) {
  return {
    deltaMs,
    width: 520,
    height: 800,
    visualSpeed: 0,
    layout: {
      world: { bottomY: 518 },
      playerKart: { anchorX: 260, anchorY: 420, maxWidth: 177, dustOriginY: 443 },
    },
    runtimeState: { visual: { reducedMotion } },
  };
}

const slotArt = () => new Texture({ source: new TextureSource({ width: 256, height: 256 }) });
const orbBurst = (id = "luck-1") => ({ id: 1, moments: [{ type: STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, id }] });
const drawnActions = (layer) => layer.feedbackGraphics.context.instructions.map(({ action }) => action);
const drawnArt = (layer) => layer.feedbackGraphics.context.instructions
  .filter(({ action }) => action === "texture").map(({ data }) => data.image);

function play(layer, type, atMs, options) {
  layer.update(frame(options));
  layer.playMoments({ id: 1, moments: [{ type, id: `luck-${type}` }] });
  layer.update(frame({ ...options, deltaMs: atMs }));
}

describe("EffectsLayer Luck art", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads each approved burst art once, pins it, and leaves the shield glint and the mud puddle to their own owners", async () => {
    const textures = new Map();
    const loadTexture = vi.fn(async (url) => textures.set(url, slotArt()).get(url));
    const prepareTexture = vi.fn();
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture });
    await layer.artPromise;

    expect(loadTexture.mock.calls.map(([url]) => url))
      .toEqual(["energyOrb.webp", "windLeaf.webp", "mudDrop.webp", "shieldImpact.webp"]);
    expect(prepareTexture.mock.calls.map(([texture]) => texture)).toEqual([...textures.values()]);
    layer.destroy();
  });

  it.each(BURST_ART)("draws %s with its approved %s art", async (type, slot, atMs) => {
    const art = slotArt();
    const loadTexture = vi.fn(async (url) => (url === `${slot}.webp` ? art : slotArt()));
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture: vi.fn() });
    await layer.artPromise;

    play(layer, type, atMs);

    expect(drawnArt(layer)).toContain(art);
    layer.destroy();
  });

  it("keeps the other art when one file fails, and draws that burst without it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const loadTexture = vi.fn(async (url) => {
      if (url === "windLeaf.webp") throw new Error("404");
      return slotArt();
    });
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture: vi.fn() });
    await layer.artPromise;

    play(layer, STUDENT_RACE_MOMENT.LUCK_TAILWIND, 180);

    expect(Object.keys(layer.luckArt).sort()).toEqual(["energyOrb", "mudDrop", "shieldImpact"]);
    expect(drawnActions(layer)).not.toContain("texture");
    expect(drawnActions(layer).length).toBeGreaterThan(0);
    expect(error).not.toHaveBeenCalled();
    layer.destroy();
  });

  it("drops art that finishes loading after the race screen is gone", async () => {
    const finishers = [];
    const loadTexture = vi.fn(() => new Promise((resolve) => { finishers.push(resolve); }));
    const prepareTexture = vi.fn();
    const layer = new EffectsLayer(new Container(), { loadTexture, prepareTexture });
    expect(loadTexture).toHaveBeenCalledTimes(4);

    layer.destroy();
    finishers.forEach((finish) => finish(slotArt()));
    await layer.artPromise;

    expect(prepareTexture).not.toHaveBeenCalled();
    expect(layer.luckArt).toEqual({});
  });

  it("plays no burst under reduced motion, art or not", async () => {
    const layer = new EffectsLayer(new Container(), { loadTexture: async () => slotArt(), prepareTexture: vi.fn() });
    await layer.artPromise;

    play(layer, STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB, 100, { reducedMotion: true });

    expect(layer.activeEffects.size).toBe(0);
    expect(drawnActions(layer)).toEqual([]);
    layer.destroy();
  });

  it("lets the finish outrank a burst with art", async () => {
    const layer = new EffectsLayer(new Container(), { loadTexture: async () => slotArt(), prepareTexture: vi.fn() });
    await layer.artPromise;
    layer.update(frame());

    layer.playMoments({ id: 1, moments: [{ type: STUDENT_RACE_EFFECT.FINISH, id: "finish" }] });
    layer.playMoments(orbBurst("luck-2"));

    expect([...layer.activeEffects.keys()]).toEqual([STUDENT_RACE_EFFECT.FINISH]);
    layer.destroy();
  });
});
