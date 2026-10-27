import { Container, Graphics } from "pixi.js";

import { RACE_LUCK_EVENT_TYPES } from "../../../../constants/raceGameplayConstants.js";
import { VEHICLE_GROUND_Y, VEHICLE_UNIT_WIDTH } from "./studentRaceVehicleGeometry.js";

// Placeholder marks for the Guard Shield and the open Luck windows until the C5-04 art lands: plain Graphics in
// kart-local units, drawn once; frames only show or hide them and move the wind.
const SHIELD_COLOR = 0x74c0fc;
const SHINE_COLOR = 0xffffff;
const WIND_COLOR = 0xffffff;
const MUD_COLOR = 0x7a4a22;
// Tall enough to clear the driver's helmet; its foot stays on the road.
const SHIELD = Object.freeze({ x: VEHICLE_UNIT_WIDTH / 2, y: 8, radiusX: 66, radiusY: 58 });
// Three streaks a side in the open air beside the kart, each a third of a cycle behind the last.
const WIND_STREAKS = Object.freeze([-14, -26, -38].flatMap((gap, i) => [
  Object.freeze({ x: gap, delay: i / 3 }),
  Object.freeze({ x: VEHICLE_UNIT_WIDTH - gap, delay: i / 3 }),
]));
const WIND_PERIOD_MS = 600;
const WIND_RISE = 44;
const WIND_LENGTH = 16;
// A phase where every streak shows, so the still wind of reduced motion still reads as wind.
const WIND_START_PHASE = 0.25;
// [x, depth below the ground line, radius x, radius y, alpha]: one puddle wider than the kart and a few splashes at
// its edge, so the mud shows beside and in front of the hover pads instead of hiding under them.
const MUD_SPOTS = Object.freeze([
  [50, 7, 72, 12, 0.5], [-14, 3, 10, 4, 0.8], [114, 3, 10, 4, 0.8], [18, 16, 12, 4, 0.8], [84, 17, 13, 4, 0.8],
]);

function drawShield(g) {
  g.ellipse(SHIELD.x, SHIELD.y, SHIELD.radiusX, SHIELD.radiusY)
    .fill({ color: SHIELD_COLOR, alpha: 0.1 })
    .stroke({ color: SHIELD_COLOR, alpha: 0.7, width: 2.5 });
  const { x, y, radiusX, radiusY } = SHIELD;
  g.ellipse(x - radiusX * 0.3, y - radiusY * 0.55, radiusX * 0.28, radiusY * 0.12)
    .fill({ color: SHINE_COLOR, alpha: 0.22 });
}

function drawMud(g) {
  MUD_SPOTS.forEach(([x, depth, radiusX, radiusY, alpha]) => {
    g.ellipse(x, VEHICLE_GROUND_Y + depth, radiusX, radiusY).fill({ color: MUD_COLOR, alpha });
  });
}

function drawWind(g, phase) {
  g.clear();
  WIND_STREAKS.forEach(({ x, delay }) => {
    const life = (phase + delay) % 1;
    g.roundRect(x - 1, VEHICLE_GROUND_Y - 8 - WIND_RISE * life, 2, WIND_LENGTH, 1)
      .fill({ color: WIND_COLOR, alpha: 0.6 * Math.sin(Math.PI * life) });
  });
}

export class KartLuckMarks {
  constructor(root, kart) {
    this.mud = new Graphics();
    this.shield = new Graphics();
    this.wind = new Graphics();
    this.front = new Container();
    this.front.addChild(this.wind, this.shield);
    this.windPhase = WIND_START_PHASE;
    drawMud(this.mud);
    drawShield(this.shield);
    drawWind(this.wind, this.windPhase);
    [this.mud, this.shield, this.wind, this.front].forEach((mark) => { mark.visible = false; });
    root.addChildAt(this.mud, root.getChildIndex(kart));
    kart.addChild(this.front);
  }

  update({ shield, luckEffect, deltaMs, reducedMotion }) {
    this.shield.visible = shield;
    this.mud.visible = luckEffect === RACE_LUCK_EVENT_TYPES.MUD_SPLASH;
    this.wind.visible = luckEffect === RACE_LUCK_EVENT_TYPES.TAILWIND;
    // Hidden when empty, so the kart holds nothing visible beyond its art.
    this.front.visible = this.shield.visible || this.wind.visible;
    if (!this.wind.visible || reducedMotion) return;
    this.windPhase = (this.windPhase + Math.max(0, deltaMs) / WIND_PERIOD_MS) % 1;
    drawWind(this.wind, this.windPhase);
  }
}
