import { Container, Graphics } from "pixi.js";

import { RACE_LUCK_EVENT_TYPES } from "../../../../constants/raceGameplayConstants.js";
import { KART_SHIELD_BUBBLE, VEHICLE_GROUND_Y, VEHICLE_UNIT_WIDTH } from "./studentRaceVehicleGeometry.js";

// Marks for the Guard Shield and the open Luck windows: plain Graphics in kart-local units, drawn once; frames only
// show, fade or hide them and move the wind.
const SHIELD_COLOR = 0x74c0fc;
const RIM_COLOR = 0xa5d8ff;
const SHINE_COLOR = 0xffffff;
const WIND_COLOR = 0xffffff;
const MUD_COLOR = 0x7a4a22;
const MUD_SHINE_COLOR = 0xc98a4b;
// The ring where the bubble meets the road: its far half sits behind the kart, its near half in front.
const SHIELD_FOOT = Object.freeze({ y: VEHICLE_GROUND_Y + 2, radiusX: KART_SHIELD_BUBBLE.radiusX * 0.9, radiusY: 8 });
// A broad reflection across the bubble's upper left, as angles on a slightly smaller ellipse.
const SHIELD_REFLECTION = Object.freeze({ from: Math.PI * 1.12, to: Math.PI * 1.42, inset: 0.84 });
const SHIELD_GLINTS = Object.freeze([[0.45, -0.62, 1.6], [0.58, -0.45, 1]]);
const SHIELD_FADE_IN_MS = 240;
// Three streaks a side in the open air beside the kart, each a third of a cycle behind the last.
const WIND_STREAKS = Object.freeze([-14, -26, -38].flatMap((gap, i) => [
  Object.freeze({ x: gap, delay: i / 3 }),
  Object.freeze({ x: VEHICLE_UNIT_WIDTH - gap, delay: i / 3 }),
]));
const WIND_PERIOD_MS = 600;
const WIND_RISE = 44;
const WIND_LENGTH = 16;
// How far a streak bends out from the kart as it rises, the way air spills around it.
const WIND_BEND = 3;
// A phase where every streak shows, so the still wind of reduced motion still reads as wind.
const WIND_START_PHASE = 0.25;
// [x, depth below the ground line, radius x, radius y, alpha]: one puddle wider than the kart and a few splashes at
// its edge, so the mud shows beside and in front of the hover pads instead of hiding under them.
const MUD_SPOTS = Object.freeze([
  [50, 7, 72, 12, 0.5], [-14, 3, 10, 4, 0.8], [114, 3, 10, 4, 0.8], [18, 16, 12, 4, 0.8], [84, 17, 13, 4, 0.8],
]);

// Half of the foot ring: the far side passes over the top of the ellipse, the near side under it.
function traceShieldFoot(g, near) {
  const { x } = KART_SHIELD_BUBBLE;
  const { y, radiusX, radiusY } = SHIELD_FOOT;
  return g.moveTo(x - radiusX, y).arcToSvg(radiusX, radiusY, 0, 0, near ? 0 : 1, x + radiusX, y);
}

// The glass sits behind the art, so the driver is never tinted by it.
function drawShieldBack(g) {
  const { x, y, radiusX, radiusY } = KART_SHIELD_BUBBLE;
  g.ellipse(x, y, radiusX, radiusY).fill({ color: SHIELD_COLOR, alpha: 0.14 });
  traceShieldFoot(g, false).stroke({ color: SHIELD_COLOR, alpha: 0.45, width: 2 });
}

function drawShield(g) {
  const { x, y, radiusX, radiusY } = KART_SHIELD_BUBBLE;
  // A soft glow around a crisp rim: the edge reads first and the glass stays clear.
  g.ellipse(x, y, radiusX, radiusY).stroke({ color: SHIELD_COLOR, alpha: 0.22, width: 7 });
  g.ellipse(x, y, radiusX, radiusY).stroke({ color: RIM_COLOR, alpha: 0.75, width: 2 });
  const { from, to, inset } = SHIELD_REFLECTION;
  const reflectionAt = (angle) => [x + radiusX * inset * Math.cos(angle), y + radiusY * inset * Math.sin(angle)];
  g.moveTo(...reflectionAt(from)).arcToSvg(radiusX * inset, radiusY * inset, 0, 0, 1, ...reflectionAt(to))
    .stroke({ color: SHINE_COLOR, alpha: 0.35, width: 5, cap: "round" });
  g.ellipse(x - radiusX * 0.3, y - radiusY * 0.55, radiusX * 0.28, radiusY * 0.12)
    .fill({ color: SHINE_COLOR, alpha: 0.22 });
  SHIELD_GLINTS.forEach(([dx, dy, radius]) => {
    g.circle(x + radiusX * dx, y + radiusY * dy, radius).fill({ color: SHINE_COLOR, alpha: 0.7 });
  });
  traceShieldFoot(g, true).stroke({ color: RIM_COLOR, alpha: 0.7, width: 2 });
}

function drawMud(g) {
  MUD_SPOTS.forEach(([x, depth, radiusX, radiusY, alpha]) => {
    g.ellipse(x, VEHICLE_GROUND_Y + depth, radiusX, radiusY).fill({ color: MUD_COLOR, alpha });
  });
  // A wet shine on the puddle, so it reads as mud and not as a shadow.
  g.ellipse(40, VEHICLE_GROUND_Y + 3, 34, 3).fill({ color: MUD_SHINE_COLOR, alpha: 0.3 });
}

function drawWind(g, phase) {
  g.clear();
  WIND_STREAKS.forEach(({ x, delay }) => {
    const life = (phase + delay) % 1;
    const top = VEHICLE_GROUND_Y - 8 - WIND_RISE * life;
    const side = x < VEHICLE_UNIT_WIDTH / 2 ? -1 : 1;
    g.moveTo(x, top + WIND_LENGTH)
      .quadraticCurveTo(x + side * WIND_BEND, top + WIND_LENGTH / 2, x + side * WIND_BEND * 0.7, top)
      .stroke({ color: WIND_COLOR, alpha: 0.6 * Math.sin(Math.PI * life), width: 2, cap: "round" });
  });
}

export class KartLuckMarks {
  constructor(root, kart) {
    this.mud = new Graphics();
    this.shieldBack = new Graphics();
    this.shield = new Graphics();
    this.wind = new Graphics();
    this.front = new Container();
    this.front.addChild(this.wind, this.shield);
    this.windPhase = WIND_START_PHASE;
    this.shieldAlpha = 0;
    drawMud(this.mud);
    drawShieldBack(this.shieldBack);
    drawShield(this.shield);
    drawWind(this.wind, this.windPhase);
    [this.mud, this.shieldBack, this.shield, this.wind, this.front].forEach((mark) => { mark.visible = false; });
    root.addChildAt(this.mud, root.getChildIndex(kart));
    kart.addChildAt(this.shieldBack, 0);
    kart.addChild(this.front);
  }

  update({ shield, luckEffect, deltaMs, reducedMotion }) {
    // The shield eases in when a charge comes up and leaves at once: a blocked hit plays its own burst.
    this.shieldAlpha = !shield ? 0 : reducedMotion ? 1 : Math.min(1, this.shieldAlpha + Math.max(0, deltaMs) / SHIELD_FADE_IN_MS);
    this.shield.visible = shield;
    this.shieldBack.visible = shield;
    this.shield.alpha = this.shieldAlpha;
    this.shieldBack.alpha = this.shieldAlpha;
    this.mud.visible = luckEffect === RACE_LUCK_EVENT_TYPES.MUD_SPLASH;
    this.wind.visible = luckEffect === RACE_LUCK_EVENT_TYPES.TAILWIND;
    // Hidden when empty, so the kart holds nothing visible beyond its art.
    this.front.visible = this.shield.visible || this.wind.visible;
    if (!this.wind.visible || reducedMotion) return;
    this.windPhase = (this.windPhase + Math.max(0, deltaMs) / WIND_PERIOD_MS) % 1;
    drawWind(this.wind, this.windPhase);
  }
}
