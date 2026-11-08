import { STUDENT_RACE_FEEDBACK_VISUAL } from "../../config/raceFeedbackVisualConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { CHALLENGE_RESULT_DRAWERS } from "./drawChallengeResultEffect";
import { drawMudBlob, LUCK_EFFECT_DRAWERS } from "./drawLuckEffect";
import { paintArt, paintRing } from "./paintArt";

const GREEN = 0x51cf66;
const GOLD = 0xfcc419;
const WHITE = 0xffffff;
const ORANGE = 0xe8590c;
const CYAN = 0x22b8cf;
const SKY = 0x74c0fc;

const CORRECT_CONFIG = STUDENT_RACE_FEEDBACK_VISUAL.correct;
const SPARK_ANGLES = CORRECT_CONFIG.sparkAngles.map((deg) => (deg * Math.PI) / 180);
const SPLASH_ANGLES = [10, 40, 70, 110, 140, 170].map((deg) => (deg * Math.PI) / 180);
const STREAK_OFFSETS = [-0.42, -0.28, -0.14, 0.14, 0.28, 0.42];
// Astra's V4 art, where it is loaded. The white burst ring is tinted per ring and glows wider than a stroke, so it
// shows at RING_ART_ALPHA of the stroke's alpha.
const RING_ART_ALPHA = 0.65;
const CONFETTI_ART = Object.freeze(["confettiRect", "confettiRibbon", "confettiStar", "confettiDot"]);
// Radians a paper piece turns over the finish burst, from the turn it starts at.
const CONFETTI_SPIN = 2.3;
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  angle: ((i * 360) / 14 + 12) * (Math.PI / 180),
  speed: 0.55 + (i % 3) * 0.2,
  color: [GOLD, WHITE, GREEN, SKY][i % 4],
  // The painted paper piece of the same colour, its width as a share of the kart and the turn it starts at.
  art: CONFETTI_ART[i % 4],
  paper: 0.08 + (i % 3) * 0.02,
  turn: i * 0.67,
}));

const easeOut = (t) => 1 - (1 - t) * (1 - t);
const fade = (progress, from = 1) => Math.max(0, from * (1 - progress));

function ring(g, x, y, radius, color, alpha, width, art = null) {
  if (art != null) {
    paintRing(g, art, { x, y, radiusX: radius, alpha: alpha * RING_ART_ALPHA, tint: color });
    return;
  }
  g.circle(x, y, radius).stroke({ color, alpha, width });
}

function dot(g, x, y, radius, color, alpha) {
  g.circle(x, y, radius).fill({ color, alpha });
}

function drawCorrect(g, { x, y, size, feedbackStreak = 0, effectArt }, progress) {
  const grow = easeOut(progress);
  const streak = Number.isSafeInteger(feedbackStreak) ? feedbackStreak : 0;
  const combo = Math.min(1, Math.max(0, (streak - 1) / (CORRECT_CONFIG.maxVisualStreak - 1)));
  const spread = 1 + combo * CORRECT_CONFIG.comboSpreadRatio;
  const alpha = fade(progress, 0.95);
  dot(g, x, y, size * (0.3 + 0.28 * grow), GREEN, fade(progress, 0.13));
  ring(g, x, y, size * (0.28 + 0.44 * grow) * spread, GREEN, alpha, size * 0.045 * (1 - progress) + 2,
    effectArt?.burstRing);
  if (progress > 0.12) {
    const late = (progress - 0.12) / 0.88;
    ring(g, x, y, size * (0.22 + 0.42 * easeOut(late)) * spread, GOLD, fade(late, 0.7 + 0.2 * combo), 2 + combo * 2,
      effectArt?.burstRing);
  }
  SPARK_ANGLES.forEach((angle, index) => {
    const distance = size * (0.34 + 0.45 * grow) * spread;
    const radius = size * (0.07 - 0.035 * progress)
      * (1 + combo * CORRECT_CONFIG.comboSparkScaleRatio);
    const sparkX = x + Math.cos(angle) * distance;
    const sparkY = y + Math.sin(angle) * distance * 0.8;
    if (effectArt?.sparkle != null) {
      paintArt(g, effectArt.sparkle, { x: sparkX, y: sparkY, width: 2 * radius, alpha });
      return;
    }
    g.star(sparkX, sparkY, CORRECT_CONFIG.sparkPoints, radius,
      radius * CORRECT_CONFIG.sparkInnerRatio, angle + Math.PI / 4)
      .fill({ color: index % 3 === 0 ? GREEN : GOLD, alpha });
    dot(g, sparkX, sparkY, radius * 0.18, WHITE, alpha);
  });
}

function drawWrong(g, { x, size, groundY, luckArt, effectArt, behind = g }, progress) {
  const grow = easeOut(progress);
  if (effectArt?.groundImpact != null) {
    // The dry dirt a wrong answer kicks up, painted on the road around the kart's foot, behind the kart.
    paintArt(behind, effectArt.groundImpact, { x, y: groundY, width: size * (0.66 + 0.74 * grow),
      height: size * (0.22 + 0.24 * grow), alpha: fade(progress, 0.82) });
  } else {
    g.ellipse(x, groundY, size * (0.3 + 0.35 * grow), size * (0.1 + 0.12 * grow)).stroke({ color: ORANGE, alpha: fade(progress, 0.8), width: size * 0.05 * (1 - progress) + 2 });
    g.ellipse(x, groundY, size * 0.3, size * 0.1).fill({ color: ORANGE, alpha: fade(progress, 0.18) });
  }
  // Mud thrown out from under the kart, falling back: the painted mud drop once it is loaded, heading where it flies.
  const splashAt = (angle, t) => {
    const distance = size * (0.25 + 0.45 * easeOut(t));
    return { x: x + Math.cos(angle) * distance, y: groundY - Math.sin(angle) * distance * 0.45 + size * 0.3 * t * t };
  };
  SPLASH_ANGLES.forEach((angle) => {
    const point = splashAt(angle, progress);
    const next = splashAt(angle, progress + 0.01);
    drawMudBlob(g, point, size * (0.055 - 0.03 * progress), fade(progress, 0.9), 1,
      Math.atan2(next.y - point.y, next.x - point.x), luckArt?.mudDrop);
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

function drawFinish(g, { x, y, size, width, effectArt }, progress) {
  const grow = easeOut(progress);
  dot(g, x, y, size * (0.5 + 0.4 * grow), GOLD, fade(Math.min(1, progress * 2.5), 0.25));
  ring(g, x, y, size * (0.3 + 1.3 * grow), GOLD, fade(progress, 0.8), size * 0.06 * (1 - progress) + 2,
    effectArt?.burstRing);
  ring(g, x, y, size * (0.2 + 1.0 * grow), WHITE, fade(progress, 0.6), 2, effectArt?.burstRing);
  CONFETTI.forEach(({ angle, speed, color, art, paper, turn }) => {
    const travel = width * 0.5 * speed * grow;
    const px = x + Math.cos(angle) * travel;
    const py = y + Math.sin(angle) * travel * 0.8 + width * 0.25 * progress * progress;
    const alpha = fade(Math.max(0, (progress - 0.55) / 0.45), 0.95);
    if (effectArt?.[art] != null) {
      paintArt(g, effectArt[art], { x: px, y: py, width: size * paper, alpha, rotation: turn + CONFETTI_SPIN * progress });
      return;
    }
    g.roundRect(px - size * 0.03, py - size * 0.02, size * 0.06, size * 0.04, size * 0.01).fill({ color, alpha });
  });
}

const DRAWERS = Object.freeze({
  [STUDENT_RACE_EFFECT.CORRECT]: drawCorrect,
  [STUDENT_RACE_EFFECT.WRONG]: drawWrong,
  [STUDENT_RACE_EFFECT.BOOST]: drawBoost,
  [STUDENT_RACE_EFFECT.FINISH]: drawFinish,
  ...CHALLENGE_RESULT_DRAWERS,
  ...LUCK_EFFECT_DRAWERS,
});

export function drawFeedbackEffect(graphics, effect, progress, geometry) {
  DRAWERS[effect]?.(graphics, geometry, Math.min(1, Math.max(0, progress)));
}
