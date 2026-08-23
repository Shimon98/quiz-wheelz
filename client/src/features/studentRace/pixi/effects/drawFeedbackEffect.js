import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";

const GREEN = 0x51cf66;
const GOLD = 0xfcc419;
const WHITE = 0xffffff;
const ORANGE = 0xe8590c;
const MUD = 0x8d5a2b;
const CYAN = 0x22b8cf;
const SKY = 0x74c0fc;

const SPARK_ANGLES = [-170, -135, -100, -80, -45, -10].map((deg) => (deg * Math.PI) / 180);
const SPLASH_ANGLES = [10, 40, 70, 110, 140, 170].map((deg) => (deg * Math.PI) / 180);
const STREAK_OFFSETS = [-0.42, -0.28, -0.14, 0.14, 0.28, 0.42];
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  angle: ((i * 360) / 14 + 12) * (Math.PI / 180),
  speed: 0.55 + (i % 3) * 0.2,
  color: [GOLD, WHITE, GREEN, SKY][i % 4],
}));

const easeOut = (t) => 1 - (1 - t) * (1 - t);
const fade = (progress, from = 1) => Math.max(0, from * (1 - progress));

function ring(g, x, y, radius, color, alpha, width) {
  g.circle(x, y, radius).stroke({ color, alpha, width });
}

function dot(g, x, y, radius, color, alpha) {
  g.circle(x, y, radius).fill({ color, alpha });
}

function drawCorrect(g, { x, y, size }, progress) {
  const grow = easeOut(progress);
  dot(g, x, y, size * (0.4 + 0.3 * grow), GREEN, fade(progress, 0.16));
  ring(g, x, y, size * (0.3 + 0.55 * grow), GREEN, fade(progress, 0.85), size * 0.06 * (1 - progress) + 2);
  if (progress > 0.2) {
    const late = (progress - 0.2) / 0.8;
    ring(g, x, y, size * (0.25 + 0.5 * easeOut(late)), GOLD, fade(late, 0.65), 3);
  }
  SPARK_ANGLES.forEach((angle) => {
    const distance = size * (0.4 + 0.55 * grow);
    dot(g, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * 0.8, size * (0.05 - 0.03 * progress), GOLD, fade(progress, 0.95));
  });
}

function drawWrong(g, { x, size, groundY }, progress) {
  const grow = easeOut(progress);
  g.ellipse(x, groundY, size * (0.3 + 0.35 * grow), size * (0.1 + 0.12 * grow)).stroke({ color: ORANGE, alpha: fade(progress, 0.8), width: size * 0.05 * (1 - progress) + 2 });
  g.ellipse(x, groundY, size * 0.3, size * 0.1).fill({ color: ORANGE, alpha: fade(progress, 0.18) });
  SPLASH_ANGLES.forEach((angle) => {
    const distance = size * (0.25 + 0.45 * grow);
    const drop = size * 0.3 * progress * progress;
    dot(g, x + Math.cos(angle) * distance, groundY - Math.sin(angle) * distance * 0.45 + drop, size * (0.055 - 0.03 * progress), MUD, fade(progress, 0.9));
  });
}

function drawBoost(g, { x, size, groundY, bottomY }, progress) {
  const glow = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  g.ellipse(x, groundY, size * 0.45, size * 0.12).fill({ color: CYAN, alpha: 0.5 * glow });
  g.ellipse(x, groundY, size * (0.25 + 0.5 * easeOut(progress)), size * (0.08 + 0.16 * easeOut(progress))).stroke({ color: CYAN, alpha: fade(progress, 0.6), width: 3 });
  STREAK_OFFSETS.forEach((offset, index) => {
    const phase = Math.min(1, Math.max(0, progress * 1.4 - index * 0.05));
    const top = groundY - size * 0.05;
    const length = Math.min(
      size * (0.25 + 0.45 * easeOut(phase)) * (1 - progress * 0.6),
      Math.max(size * 0.12, bottomY - top),
    );
    g.roundRect(x + offset * size - size * 0.025, top, size * 0.05, length, size * 0.025).fill({ color: index % 2 ? SKY : CYAN, alpha: fade(progress, 0.85) });
  });
}

function drawFinish(g, { x, y, size, width }, progress) {
  const grow = easeOut(progress);
  dot(g, x, y, size * (0.5 + 0.4 * grow), GOLD, fade(Math.min(1, progress * 2.5), 0.25));
  ring(g, x, y, size * (0.3 + 1.3 * grow), GOLD, fade(progress, 0.8), size * 0.06 * (1 - progress) + 2);
  ring(g, x, y, size * (0.2 + 1.0 * grow), WHITE, fade(progress, 0.6), 2);
  CONFETTI.forEach(({ angle, speed, color }) => {
    const travel = width * 0.5 * speed * grow;
    const px = x + Math.cos(angle) * travel;
    const py = y + Math.sin(angle) * travel * 0.8 + width * 0.25 * progress * progress;
    g.roundRect(px - size * 0.03, py - size * 0.02, size * 0.06, size * 0.04, size * 0.01).fill({ color, alpha: fade(Math.max(0, (progress - 0.55) / 0.45), 0.95) });
  });
}

const DRAWERS = Object.freeze({
  [STUDENT_RACE_EFFECT.CORRECT]: drawCorrect,
  [STUDENT_RACE_EFFECT.WRONG]: drawWrong,
  [STUDENT_RACE_EFFECT.BOOST]: drawBoost,
  [STUDENT_RACE_EFFECT.FINISH]: drawFinish,
});

export function drawFeedbackEffect(graphics, effect, progress, geometry) {
  DRAWERS[effect]?.(graphics, geometry, Math.min(1, Math.max(0, progress)));
}
