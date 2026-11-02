import { Graphics, Texture, TextureSource } from "pixi.js";
import { describe, expect, it } from "vitest";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../../config/raceAnimationConfig";
import { STUDENT_RACE_MOMENT } from "../../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_ART } from "../../assets/studentRaceEffectManifest";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest";
import {
  artPixelToKartLocal,
  KART_SHIELD_BUBBLE,
  kartLocalToScreen,
  VEHICLE_GROUND_Y,
  VEHICLE_UNIT_WIDTH,
} from "../../vehicles/studentRaceVehicleGeometry";
import { LUCK_EFFECT_DRAWERS } from "../drawLuckEffect";

const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;
const KART_ART = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN;
const ART_FRAME = Object.freeze({ width: 768, height: 768 });
// The player's kart as EffectsLayer hands it over: its ground point, screen pixels per kart unit, helmet top and the
// art frame's width in kart units.
const KART = Object.freeze({ x: 260, y: 443, scale: 1.5, headTopY: -40.6, artWidth: 108 });
const VIEW = Object.freeze({ kart: KART, width: 520, luckArt: {} });
const LUCK_MOMENTS = [
  STUDENT_RACE_MOMENT.LUCK_TAILWIND,
  STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB,
  STUDENT_RACE_MOMENT.LUCK_MUD,
  STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED,
];
// The art's opaque columns, measured in the 768 px hover-kart art: 32 to 736.
const artEdge = (column) => kartLocalToScreen(KART, artPixelToKartLocal({ x: column, y: 0 }, ART_FRAME, KART_ART).x, 0).x;
const ART_LEFT = artEdge(32);
const ART_RIGHT = artEdge(736);
const HELMET_Y = kartLocalToScreen(KART, 50, KART.headTopY).y;
const GROUND_Y = kartLocalToScreen(KART, 50, VEHICLE_GROUND_Y).y;
// One kart width as V3 measures its effects: the whole art frame, on screen.
const KART_WIDTH = VEHICLE_UNIT_WIDTH * KART_ART.baseScale * KART.scale;
// The body of a mud blob, the colour the tests find it by.
const MUD_COLORS = new Set([0x663b22]);

const art = () => new Texture({ source: new TextureSource({ width: 256, height: 256 }) });
const atMs = (durationMs, ms) => ms / durationMs;

function paint(effect, progress, luckArt = {}) {
  const g = new Graphics();
  LUCK_EFFECT_DRAWERS[effect](g, { ...VIEW, luckArt }, progress);
  return g;
}

const drawn = (g, action) => g.context.instructions.filter((instruction) => instruction.action === action);
const alphas = (g) => g.context.instructions.map(({ action, data }) => (action === "texture" ? data.alpha : data.style.alpha));
// Filled circles and ellipses, each centre taken through the transform it was drawn with.
const circles = (g) => drawn(g, "fill").flatMap(({ data }) => data.path.instructions
  .filter(({ action }) => action === "circle" || action === "ellipse")
  .map(({ action, data: shape }) => {
    const { x, y } = shape.at(-1).apply({ x: shape[0], y: shape[1] });
    const radius = action === "circle" ? shape[2] : Math.max(shape[2], shape[3]);
    return { x, y, radius, color: data.style.color, alpha: data.style.alpha };
  }));
// Where a point of a drawn image lands, through the transform it was drawn with: its centre by default.
function artPoint({ data }, anchorX = 0.5, anchorY = 0.5) {
  return data.transform.apply({ x: data.dx + data.dw * anchorX, y: data.dy + data.dh * anchorY });
}
const artCentre = (instruction) => artPoint(instruction);
const shapeBounds = (instruction) => instruction.data.path.bounds;
const onBubble = ({ x, y }) => {
  const centre = kartLocalToScreen(KART, KART_SHIELD_BUBBLE.x, KART_SHIELD_BUBBLE.y);
  return ((x - centre.x) / (KART_SHIELD_BUBBLE.radiusX * KART.scale)) ** 2
    + ((y - centre.y) / (KART_SHIELD_BUBBLE.radiusY * KART.scale)) ** 2;
};

describe("Luck one-shot effects", () => {
  it("has a drawer for every Luck moment", () => {
    expect(Object.keys(LUCK_EFFECT_DRAWERS).sort()).toEqual([...LUCK_MOMENTS].sort());
  });

  it.each(LUCK_MOMENTS)("paints %s at mid-life and leaves nothing visible at its end", (effect) => {
    expect(alphas(paint(effect, 0.4)).some((alpha) => alpha > 0.05)).toBe(true);
    expect(alphas(paint(effect, 1)).every((alpha) => alpha <= 0.001)).toBe(true);
  });

  it.each(LUCK_MOMENTS)("keeps %s inside the road view", (effect) => {
    for (const progress of [0.1, 0.3, 0.5, 0.9]) {
      const bounds = paint(effect, progress).getLocalBounds();
      expect(bounds.minX).toBeGreaterThanOrEqual(0);
      expect(bounds.maxX).toBeLessThanOrEqual(VIEW.width);
    }
  });
});

describe("Energy Orb", () => {
  const ORB = STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB;
  const DURATION = DURATIONS.luckEnergyOrbEffectDurationMs;
  const orbCentre = (g) => circles(g).reduce((largest, circle) => (circle.radius > largest.radius ? circle : largest));

  it("lights up clear of the helmet and rises as it fades", () => {
    const peak = paint(ORB, atMs(DURATION, 150));
    const late = paint(ORB, atMs(DURATION, 450));

    [0, 40, 150, 300, 450, 540].forEach((ms) => {
      expect(paint(ORB, atMs(DURATION, ms)).getLocalBounds().maxY).toBeLessThan(HELMET_Y);
    });
    expect(orbCentre(peak).x).toBeCloseTo(KART.x);
    expect(orbCentre(late).y).toBeLessThan(orbCentre(peak).y);
    expect(Math.max(...alphas(late))).toBeLessThan(Math.max(...alphas(peak)));
  });

  it("paints approved art as the whole orb, 0.43 kart widths wide over the kart and clear of the helmet", () => {
    const orb = art();
    const g = paint(ORB, atMs(DURATION, 150), { energyOrb: orb });

    const [painted, ...extra] = drawn(g, "texture");
    const centre = artCentre(painted);
    expect(extra).toEqual([]);
    expect(painted.data.image).toBe(orb);
    expect(centre.x).toBeCloseTo(KART.x);
    expect(painted.data.dw).toBeCloseTo(0.43 * KART_WIDTH);
    expect(painted.data.dh).toBeCloseTo(painted.data.dw);
    expect(centre.y + painted.data.dh / 2).toBeLessThan(HELMET_Y);
    expect(painted.data.alpha).toBeGreaterThan(0.9);
  });

  it("keeps the drawn core when no art is loaded", () => {
    const g = paint(ORB, atMs(DURATION, 150));

    expect(drawn(g, "texture")).toEqual([]);
    expect(circles(g).length).toBeGreaterThan(2);
  });

  it("draws the art at its own alpha, whatever was filled before it", () => {
    const g = new Graphics();
    g.circle(0, 0, 1).fill({ color: 0xffffff, alpha: 0.2 });

    LUCK_EFFECT_DRAWERS[ORB](g, { ...VIEW, luckArt: { energyOrb: art() } }, atMs(DURATION, 150));
    g.texture(art());

    const [orbArt, later] = drawn(g, "texture");
    expect(orbArt.data.alpha).toBeGreaterThan(0.9);
    expect(later.data.alpha).toBe(0.2);
  });
});

describe("Tailwind", () => {
  const WIND = STUDENT_RACE_MOMENT.LUCK_TAILWIND;
  const DURATION = DURATIONS.luckTailwindEffectDurationMs;

  it("streams up both sides of the kart, never across its art", () => {
    const g = paint(WIND, atMs(DURATION, 180));
    const shapes = [...drawn(g, "fill"), ...drawn(g, "stroke")].map(shapeBounds);

    expect(shapes.some(({ maxX }) => maxX < ART_LEFT)).toBe(true);
    expect(shapes.some(({ minX }) => minX > ART_RIGHT)).toBe(true);
    shapes.forEach(({ minX, maxX }) => expect(maxX < ART_LEFT || minX > ART_RIGHT).toBe(true));
  });

  it("carries a leaf on each side only once its art is loaded", () => {
    const leaf = art();
    const leaves = drawn(paint(WIND, atMs(DURATION, 180), { windLeaf: leaf }), "texture");

    expect(drawn(paint(WIND, atMs(DURATION, 180)), "texture")).toEqual([]);
    expect(leaves.length).toBeGreaterThanOrEqual(2);
    leaves.forEach((instruction) => {
      expect(instruction.data.image).toBe(leaf);
      expect(instruction.data.dw).toBeCloseTo(0.2 * KART_WIDTH);
      const { x } = artCentre(instruction);
      expect(x < ART_LEFT || x > ART_RIGHT).toBe(true);
    });
  });
});

describe("Mud splash", () => {
  const MUD = STUDENT_RACE_MOMENT.LUCK_MUD;
  const DURATION = DURATIONS.luckMudEffectDurationMs;

  it("flies in from the side before it lands", () => {
    const blobs = circles(paint(MUD, atMs(DURATION, 30))).filter(({ color }) => MUD_COLORS.has(color));

    expect(blobs.length).toBeGreaterThan(0);
    blobs.forEach(({ x, y }) => {
      expect(x).toBeLessThan(KART.x);
      expect(y).toBeLessThan(GROUND_Y);
    });
  });

  it("splashes low on the road under the kart, below the driver", () => {
    const bounds = paint(MUD, atMs(DURATION, 140)).getLocalBounds();

    expect(bounds.maxY).toBeGreaterThan(GROUND_Y);
    expect(bounds.minY).toBeGreaterThan(kartLocalToScreen(KART, 50, 0).y);
  });

  it("lets painted splash art bring its own drops", () => {
    const drops = (luckArt) => circles(paint(MUD, atMs(DURATION, 300), luckArt)).filter(({ color }) => MUD_COLORS.has(color));

    expect(drops({}).length).toBeGreaterThan(0);
    expect(drops({ mudSplash: art() })).toEqual([]);
  });

  it("spreads approved splash art wide and low along the kart's own ground line", () => {
    const splash = art();
    const [painted, ...extra] = drawn(paint(MUD, atMs(DURATION, 140), { mudSplash: splash }), "texture");
    const { anchorX, anchorY } = LUCK_EFFECT_ART.mudSplash;

    const ground = artPoint(painted, anchorX, anchorY);
    expect(extra).toEqual([]);
    expect(painted.data.image).toBe(splash);
    expect(ground.x).toBeCloseTo(KART.x);
    expect(ground.y).toBeCloseTo(GROUND_Y);
    expect(painted.data.dw).toBeGreaterThan((ART_RIGHT - ART_LEFT) * 1.5);
    expect(drawn(paint(MUD, atMs(DURATION, 140)), "texture")).toEqual([]);
  });
});

describe("Shield blocked", () => {
  const BLOCKED = STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED;
  const DURATION = DURATIONS.luckShieldBlockedEffectDurationMs;
  const bubbleCentre = kartLocalToScreen(KART, KART_SHIELD_BUBBLE.x, KART_SHIELD_BUBBLE.y);
  const mudReach = (g) => {
    const blobs = circles(g).filter(({ color }) => MUD_COLORS.has(color));
    return blobs.reduce((sum, { x, y }) => sum + Math.hypot(x - bubbleCentre.x, y - bubbleCentre.y), 0) / blobs.length;
  };

  it("meets the mud on the standing shield's own edge", () => {
    const flash = circles(paint(BLOCKED, atMs(DURATION, 130))).filter(({ color }) => color === 0xffffff);

    expect(flash.length).toBeGreaterThan(0);
    flash.forEach((circle) => expect(onBubble(circle)).toBeCloseTo(1, 1));
  });

  it("drives the mud in, then throws it back out, away from the kart", () => {
    expect(mudReach(paint(BLOCKED, atMs(DURATION, 60)))).toBeLessThan(mudReach(paint(BLOCKED, atMs(DURATION, 10))));
    expect(mudReach(paint(BLOCKED, atMs(DURATION, 450)))).toBeGreaterThan(mudReach(paint(BLOCKED, atMs(DURATION, 250))));
    expect(mudReach(paint(BLOCKED, atMs(DURATION, 250)))).toBeGreaterThan(KART_SHIELD_BUBBLE.radiusY * KART.scale);
  });

  it("puts approved impact art's own contact point on the shield's edge, 0.48 kart widths wide", () => {
    const impact = art();
    const [painted, ...extra] = drawn(paint(BLOCKED, atMs(DURATION, 130), { shieldImpact: impact }), "texture");
    const { anchorX, anchorY } = LUCK_EFFECT_ART.shieldImpact;

    expect(extra).toEqual([]);
    expect(painted.data.image).toBe(impact);
    expect(onBubble(artPoint(painted, anchorX, anchorY))).toBeCloseTo(1, 1);
    expect(painted.data.dw).toBeCloseTo(0.48 * KART_WIDTH);
    expect(drawn(paint(BLOCKED, atMs(DURATION, 130)), "texture")).toEqual([]);
  });
});
