import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { RACE_LUCK_EVENT_TYPES } from "../../../../../constants/raceGameplayConstants";
import { KartLuckMarks } from "../KartLuckMarks";
import { KART_SHIELD_BUBBLE } from "../studentRaceVehicleGeometry";

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
