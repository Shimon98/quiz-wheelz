import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";

// Placeholder bursts until the C5-04 art lands: plain Graphics beside and above the kart, so the driver stays in
// view, each fully faded by the end of its short life.
const WHITE = 0xffffff;
const GOLD = 0xfcc419;
const MUD = 0x8d5a2b;
const SKY = 0x74c0fc;

// Gust lines rush forward up the road on both sides of the kart, a beat apart.
const GUST_LINES = [0.55, 0.75, 0.95].flatMap((reach, i) => [-1, 1].map((side) => ({ side, reach, delay: i * 0.1 })));
const MUD_DROPS = Array.from({ length: 8 }, (_, i) => ({
  side: i % 2 === 0 ? -1 : 1,
  spread: 0.25 + (i >> 1) * 0.12,
  lift: 0.18 + ((i * 7) % 5) * 0.05,
}));
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const fade = (progress, from = 1) => Math.max(0, from * (1 - progress));

function drawTailwind(g, { x, y, size }, progress) {
  GUST_LINES.forEach(({ side, reach, delay }) => {
    const life = Math.min(1, Math.max(0, (progress - delay) / (1 - delay)));
    if (life <= 0) return;
    const top = y + size * 0.3 - size * 0.9 * easeOut(life);
    g.roundRect(x + side * size * reach - 1, top, 2, size * 0.28, 1).fill({ color: WHITE, alpha: fade(life, 0.7) });
  });
}

// The orb rises over the kart and fades as the energy meter takes it in.
function drawEnergyOrb(g, { x, y, size }, progress) {
  const rise = easeOut(progress);
  const orbY = y - size * (0.55 + 0.5 * rise);
  const alpha = fade(progress, 0.9);
  g.circle(x, orbY, size * (0.09 - 0.03 * rise)).fill({ color: GOLD, alpha });
  g.circle(x, orbY, size * (0.13 + 0.05 * rise)).stroke({ color: WHITE, alpha: alpha * 0.6, width: 2 });
}

function drawMudSplash(g, { x, groundY, size }, progress) {
  const travel = easeOut(progress);
  const arc = Math.sin(Math.PI * Math.min(1, progress * 1.2));
  MUD_DROPS.forEach(({ side, spread, lift }) => {
    g.circle(x + side * size * (spread + 0.2 * travel), groundY - size * lift * arc, size * 0.035)
      .fill({ color: MUD, alpha: fade(progress, 0.85) });
  });
}

// The shield flashes and throws the mud back out, away from the kart.
function drawShieldBlocked(g, { x, y, size }, progress) {
  const grow = easeOut(progress);
  g.ellipse(x, y - size * 0.1, size * (0.62 + 0.18 * grow), size * (0.5 + 0.14 * grow))
    .stroke({ color: SKY, alpha: fade(progress, 0.85), width: 3 });
  MUD_DROPS.forEach(({ side, spread, lift }) => {
    g.circle(x + side * size * (0.6 + spread * 0.6 * grow), y - size * (lift - 0.3) - size * 0.2 * grow, size * 0.03)
      .fill({ color: MUD, alpha: fade(progress, 0.8) });
  });
}

export const LUCK_EFFECT_DRAWERS = Object.freeze({
  [STUDENT_RACE_EFFECT.LUCK_TAILWIND]: drawTailwind,
  [STUDENT_RACE_EFFECT.LUCK_ENERGY_ORB]: drawEnergyOrb,
  [STUDENT_RACE_EFFECT.LUCK_MUD]: drawMudSplash,
  [STUDENT_RACE_EFFECT.LUCK_SHIELD_BLOCKED]: drawShieldBlocked,
});
