import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";

import { RACE_LUCK_EVENT_TYPES } from "../../../../../constants/raceGameplayConstants";
import { KartLuckMarks } from "../KartLuckMarks";

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

  it("raises the shield only while a charge is up", () => {
    const { marks } = mounted();

    step(marks, { shield: true });
    expect([marks.shield.visible, marks.front.visible]).toEqual([true, true]);
    step(marks, { shield: false });
    expect([marks.shield.visible, marks.front.visible]).toEqual([false, false]);
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
