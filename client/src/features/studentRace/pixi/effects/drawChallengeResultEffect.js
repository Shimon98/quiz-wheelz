import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { paintArt, paintRing } from "./paintArt";

const WHITE = 0xffffff;
const SMOKE_DARK = 0x5f6670;
const SMOKE_LIGHT = 0x9aa1a9;
const SKY = 0x74c0fc;
const BANANA = 0xffe066;

// Thruster centres on the kart art, as a share of the kart's drawn width.
const THRUSTER_OFFSET_X = 0.31;
const THRUSTER_OFFSET_Y = 0.08;

// Speed lines in the free road on each side of the kart, placed as shares of that free width.
const SPEED_LINES = [0.12, 0.38, 0.72]
  .flatMap((share, i) => [-1, 1].map((side) => ({ side, share, delay: (i % 3) * 0.06 })));
// Astra's V4 art, where it is loaded: a painted smoke puff turns this far away from the kart as it rises, and the
// soft painted ring shows at SAFE_RING_ART_ALPHA of the thin stroke's alpha.
const SMOKE_ART_TURN = 0.3;
const SAFE_RING_ART_ALPHA = 1.4;
const SMOKE_PUFFS = Array.from({ length: 8 }, (_, i) => ({
  side: i % 2 === 0 ? -1 : 1,
  delay: (i >> 1) * 0.12,
  drift: ((i * 37) % 11) / 11 - 0.5,
}));
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const fade = (progress, from = 1) => Math.max(0, from * (1 - progress));
const window01 = (progress, start) => Math.min(1, Math.max(0, (progress - start) / (1 - start)));

function drawSpeedLines(g, { x, size, groundY, bottomY, width }, progress) {
  const life = window01(progress, 0.2);
  if (!(width > 0) || life <= 0) return;
  const clear = size * 0.62;
  SPEED_LINES.forEach(({ side, share, delay }, index) => {
    const lineLife = Math.min(1, Math.max(0, (life - delay) / (1 - delay)));
    if (lineLife <= 0) return;
    const from = side < 0 ? 0 : Math.min(width, x + clear);
    const to = side < 0 ? Math.max(0, x - clear) : width;
    const lineX = from + (to - from) * share;
    const top = groundY - size * 0.8 + (bottomY - groundY + size * 0.8) * 0.55 * easeOut(lineLife);
    g.roundRect(lineX - 0.75, top, 1.5, size * (0.24 + 0.16 * share), 0.75)
      .fill({ color: index % 3 === 0 ? BANANA : WHITE, alpha: fade(lineLife, 0.22) });
  });
}

function drawTurboSuccess(g, geometry, progress) {
  drawSpeedLines(g, geometry, progress);
}

function drawTurboFailure(g, { x, y, size, effectArt, behind = g }, progress) {
  const thrusterY = y + size * THRUSTER_OFFSET_Y;
  SMOKE_PUFFS.forEach(({ side, delay, drift }, index) => {
    const life = window01(progress, delay);
    if (life <= 0) return;
    const rise = easeOut(life);
    const puffX = x + side * size * THRUSTER_OFFSET_X + drift * size * 0.2 * rise;
    const puffY = thrusterY - size * 0.45 * rise;
    const radius = size * (0.05 + 0.1 * rise);
    if (effectArt?.smokePuff != null) {
      // Painted smoke rises behind the kart, beside the driver instead of over them.
      paintArt(behind, effectArt.smokePuff, { x: puffX, y: puffY, width: 2 * radius, alpha: fade(life, 0.65),
        rotation: side * life * SMOKE_ART_TURN });
      return;
    }
    g.circle(puffX, puffY, radius).fill({ color: index % 3 === 0 ? SMOKE_DARK : SMOKE_LIGHT, alpha: fade(life, 0.6) });
  });
}

// A shallow ground ripple leaves the driver and cockpit unobstructed.
function drawSafeRipple(g, { x, groundY, size, effectArt }, progress, peakAlpha) {
  const alpha = peakAlpha * Math.sin(Math.PI * progress) ** 2;
  if (alpha < 0.001) return;
  const grow = easeOut(progress);
  const radiusX = size * (0.5 + 0.12 * grow);
  const radiusY = size * (0.09 + 0.03 * grow);
  if (effectArt?.burstRing != null) {
    paintRing(g, effectArt.burstRing, { x, y: groundY, radiusX, radiusY, alpha: alpha * SAFE_RING_ART_ALPHA, tint: SKY });
    return;
  }
  g.ellipse(x, groundY, radiusX, radiusY).stroke({ color: SKY, alpha, width: 1.25 });
}

function drawSafeComplete(g, geometry, progress) {
  drawSafeRipple(g, geometry, progress, 0.16);
}

function drawSafePerfect(g, geometry, progress) {
  drawSafeRipple(g, geometry, progress, 0.26);
}

export const CHALLENGE_RESULT_DRAWERS = Object.freeze({
  [STUDENT_RACE_EFFECT.TURBO_SUCCESS]: drawTurboSuccess,
  [STUDENT_RACE_EFFECT.TURBO_FAILURE]: drawTurboFailure,
  [STUDENT_RACE_EFFECT.SAFE_COMPLETE]: drawSafeComplete,
  [STUDENT_RACE_EFFECT.SAFE_PERFECT]: drawSafePerfect,
});
