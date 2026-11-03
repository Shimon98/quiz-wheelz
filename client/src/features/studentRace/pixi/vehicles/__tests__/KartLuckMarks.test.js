import { Container, Point, Texture, TextureSource } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { RACE_LUCK_EVENT_TYPES } from "../../../../../constants/raceGameplayConstants";
import { STUDENT_RACE_EFFECT } from "../../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { KartLuckMarks } from "../KartLuckMarks";
import { KART_SHIELD_BUBBLE, VEHICLE_GROUND_Y, VEHICLE_UNIT_WIDTH } from "../studentRaceVehicleGeometry";

const MUD = RACE_LUCK_EVENT_TYPES.MUD_SPLASH;
// One kart width as Astra's V3 measures its effects: the 108-unit art frame.
const KART_WIDTH = 108;
const puddleArt = () => new Texture({ source: new TextureSource({ width: 512, height: 183 }) });

function mounted() {
  const root = new Container();
  const shadow = new Container();
  const kart = new Container();
  root.addChild(shadow, kart);
  return { root, shadow, kart, marks: new KartLuckMarks(root, kart) };
}

function step(marks, { shield = false, luckEffect = null, deltaMs = 100, reducedMotion = false } = {}) {
  marks.update({ shield, luckEffect, deltaMs, reducedMotion });
}

const shown = (marks) => ({ shield: marks.shield.visible, wind: marks.wind.visible, mud: marks.mud.visible });

describe("KartLuckMarks", () => {
  it("keeps the shield and the wind inside the bobbing kart and the mud on the ground under it", () => {
    const { root, shadow, kart, marks } = mounted();

    expect(marks.front.parent).toBe(kart);
    expect(marks.mud.parent).toBe(root);
    expect(root.getChildIndex(marks.mud)).toBeGreaterThan(root.getChildIndex(shadow));
    expect(root.getChildIndex(marks.mud)).toBeLessThan(root.getChildIndex(kart));
  });

  it("starts with nothing shown, not even an empty layer in the kart", () => {
    const { marks } = mounted();

    expect(shown(marks)).toEqual({ shield: false, wind: false, mud: false });
    expect(marks.front.visible).toBe(false);
  });

  it("keeps the shield's glass behind the art and its rim in front, both bobbing with the kart", () => {
    const { kart, marks } = mounted();

    expect(marks.shieldBack.parent).toBe(kart);
    expect(kart.getChildIndex(marks.shieldBack)).toBe(0);
    expect(kart.getChildIndex(marks.front)).toBeGreaterThan(kart.getChildIndex(marks.shieldBack));
  });

  it("draws the standing shield on the shared bubble", () => {
    const { marks } = mounted();
    const { x, y, radiusX, radiusY } = KART_SHIELD_BUBBLE;

    const glass = marks.shieldBack.getLocalBounds();

    expect([glass.minX, glass.maxX, glass.minY, glass.maxY].map(Math.round))
      .toEqual([x - radiusX, x + radiusX, y - radiusY, y + radiusY]);
  });

  it("fades the shield in when a charge comes up, and shows it at once under reduced motion", () => {
    const { marks } = mounted();

    step(marks, { shield: true, deltaMs: 60 });
    const rising = marks.shield.alpha;
    step(marks, { shield: true, deltaMs: 1000 });

    expect(rising).toBeGreaterThan(0);
    expect(rising).toBeLessThan(1);
    expect([marks.shield.alpha, marks.shieldBack.alpha]).toEqual([1, 1]);

    const still = mounted().marks;
    step(still, { shield: true, deltaMs: 16, reducedMotion: true });
    expect([still.shield.alpha, still.shieldBack.alpha, still.shieldBack.visible]).toEqual([1, 1, true]);
  });

  it("raises the shield only while a charge is up", () => {
    const { marks } = mounted();

    step(marks, { shield: true });
    expect([marks.shield.visible, marks.shieldBack.visible, marks.front.visible]).toEqual([true, true, true]);
    step(marks, { shield: false });
    expect([marks.shield.visible, marks.shieldBack.visible, marks.front.visible]).toEqual([false, false, false]);
  });

  it.each([
    [RACE_LUCK_EVENT_TYPES.TAILWIND, { shield: false, wind: true, mud: false }],
    [RACE_LUCK_EVENT_TYPES.MUD_SPLASH, { shield: false, wind: false, mud: true }],
    [null, { shield: false, wind: false, mud: false }],
  ])("shows only the mark of the open %s window", (luckEffect, expected) => {
    const { marks } = mounted();

    step(marks, { luckEffect });

    expect(shown(marks)).toEqual(expected);
  });

  it("blows the wind forward over time and holds it still under reduced motion", () => {
    const { marks } = mounted();

    step(marks, { luckEffect: RACE_LUCK_EVENT_TYPES.TAILWIND, deltaMs: 100 });
    const first = marks.windPhase;
    step(marks, { luckEffect: RACE_LUCK_EVENT_TYPES.TAILWIND, deltaMs: 100 });
    expect(marks.windPhase).not.toBe(first);

    step(marks, { luckEffect: RACE_LUCK_EVENT_TYPES.TAILWIND, deltaMs: 100, reducedMotion: true });
    const still = marks.windPhase;
    step(marks, { luckEffect: RACE_LUCK_EVENT_TYPES.TAILWIND, deltaMs: 100, reducedMotion: true });
    expect(marks.windPhase).toBe(still);
    expect(marks.wind.visible).toBe(true);
  });
});

describe("KartLuckMarks mud puddle", () => {
  it("lays Astra's painted puddle around the kart's foot once it loads, pinned, in place of the drawn one", async () => {
    const art = puddleArt();
    const prepareTexture = vi.fn();
    const { marks } = mounted();

    expect(await marks.loadArt(async () => art, prepareTexture)).toBe(true);

    const painted = marks.mud.children.at(-1);
    const ground = painted.toGlobal(new Point(0, 0));
    expect(painted.texture).toBe(art);
    expect(prepareTexture).toHaveBeenCalledWith(art);
    expect([painted.anchor.x, painted.anchor.y]).toEqual([LUCK_EFFECT_ART.mudSplash.anchorX, LUCK_EFFECT_ART.mudSplash.anchorY]);
    expect(ground.x).toBeCloseTo(VEHICLE_UNIT_WIDTH / 2);
    expect(ground.y).toBeGreaterThan(VEHICLE_GROUND_Y);
    expect(ground.y).toBeLessThan(VEHICLE_GROUND_Y + 0.1 * KART_WIDTH);
    expect(painted.width / KART_WIDTH).toBeCloseTo(1.7, 1);
    expect(marks.mudDrawn.visible).toBe(false);
  });

  it("keeps the drawn puddle when the painting fails, or arrives after the race screen is gone", async () => {
    const failing = mounted().marks;
    expect(await failing.loadArt(async () => { throw new Error("404"); }, vi.fn())).toBe(false);
    expect(failing.mud.children).toEqual([failing.mudDrawn]);
    expect(failing.mudDrawn.visible).toBe(true);

    const { root, marks } = mounted();
    const prepareTexture = vi.fn();
    let finish = null;
    const late = new Promise((resolve) => { finish = resolve; });
    const loading = marks.loadArt(() => late, prepareTexture);
    root.destroy({ children: true });
    finish(puddleArt());

    expect(await loading).toBe(false);
    expect(prepareTexture).not.toHaveBeenCalled();
  });

  it("bursts the puddle up on a Mud moment once the blobs land, then settles it lower and keeps it", () => {
    const { marks } = mounted();
    const scale = () => [marks.mud.scale.x, marks.mud.scale.y];

    marks.play(STUDENT_RACE_EFFECT.LUCK_MUD);
    step(marks, { luckEffect: MUD, deltaMs: 40 });
    expect(marks.mud.visible).toBe(false);
    step(marks, { luckEffect: MUD, deltaMs: 50 });
    const [springingX, springingY] = scale();
    step(marks, { luckEffect: MUD, deltaMs: 70 });
    const peak = scale();
    step(marks, { luckEffect: MUD, deltaMs: 400 });
    const settled = scale();
    step(marks, { luckEffect: MUD, deltaMs: 2000 });

    expect(marks.mud.visible).toBe(true);
    expect(springingX).toBeGreaterThan(0.6);
    expect(springingX).toBeLessThan(1);
    expect(springingY).toBe(springingX);
    expect(peak).toEqual([1, 1]);
    expect(settled[0]).toBe(1);
    expect(settled[1]).toBeLessThan(0.7);
    expect(scale()).toEqual(settled);
  });

  it("shows the puddle settled at once without a moment (a refresh mid-window) and under reduced motion", () => {
    const burst = mounted().marks;
    burst.play(STUDENT_RACE_EFFECT.LUCK_MUD);
    step(burst, { luckEffect: MUD, deltaMs: 1000 });

    const refreshed = mounted().marks;
    step(refreshed, { luckEffect: MUD, deltaMs: 16 });
    const still = mounted().marks;
    still.play(STUDENT_RACE_EFFECT.LUCK_MUD);
    step(still, { luckEffect: MUD, deltaMs: 16, reducedMotion: true });

    [refreshed, still].forEach((marks) => {
      expect(marks.mud.visible).toBe(true);
      expect([marks.mud.scale.x, marks.mud.scale.y]).toEqual([burst.mud.scale.x, burst.mud.scale.y]);
    });
  });

  it("fades the puddle out after its window closes, and drops it at once under reduced motion", () => {
    const { marks } = mounted();
    step(marks, { luckEffect: MUD });
    step(marks, { luckEffect: null, deltaMs: 100 });
    const fading = marks.mud.alpha;
    step(marks, { luckEffect: null, deltaMs: 1000 });

    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(1);
    expect(marks.mud.visible).toBe(false);

    const still = mounted().marks;
    step(still, { luckEffect: MUD, reducedMotion: true });
    step(still, { luckEffect: null, deltaMs: 16, reducedMotion: true });
    expect(still.mud.visible).toBe(false);
  });
});
