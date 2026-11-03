import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_ART } from "../assets/studentRaceEffectManifest";
import {
  KART_SHIELD_BUBBLE,
  kartLocalToScreen,
  VEHICLE_GROUND_Y,
  VEHICLE_UNIT_WIDTH,
} from "../vehicles/studentRaceVehicleGeometry";

// Luck bursts (C5-04f): placed on the player's kart in kart-local units, so they fit it on every screen, and played
// in beats timed in ms of their configured life. Approved art stands in for one part of a burst; the rest is drawn.
// Sizes follow Astra's V3 review, which measures them in kart widths (the art frame, `kart.artWidth` units).
const { effects: DURATIONS } = STUDENT_RACE_ANIMATION_CONFIG;
const WHITE = 0xffffff;
const GOLD = 0xfcc419;
const GOLD_LIGHT = 0xffe066;
const HALO = 0xffd43b;
const ORB_FLASH = 0xfffce6;
const ORB_PULSE = 0xffec9e;
const ORB_MOTE = 0xffe6a0;
const WIND_LAYERS = Object.freeze([[8, 0xa4e7f2, 0.25], [3, 0xd2f7fa, 0.65], [0.9, WHITE, 0.8]]);
const SKY = 0x6cdcff;
const ICE = 0xe8fdff;
const RIPPLE = 0xd7fcff;
const MUD_DARK = 0x663b22;
const MUD = 0xa16b3c;
const MUD_LIGHT = 0xd2a16b;

// The orb, in kart widths: its art square, the gap it keeps above the helmet (more than the kart's bob) and how far
// it rises while it fades. It ignites by ignitedMs, holds until fullUntilMs, then rises and fades out; a light pulse
// spreads from it and two motes drift up beside it instead of a ring around it.
const ORB = Object.freeze({ size: 0.43, gap: 0.075, rise: 0.24, ignitedMs: 80, fullUntilMs: 220 });
const ORB_FLASH_MS = Object.freeze({ fadeFromMs: 30, goneMs: 95 });
const ORB_PULSE_MS = Object.freeze({ fromMs: 40, toMs: 270 });
// [side, delay in ms]: the two motes, each drifting for 300 ms.
const ORB_MOTES = Object.freeze([[-1, 0], [1, 45]]);
const ORB_MOTE_MS = Object.freeze({ fromMs: 90, runMs: 300 });

// The wind's path a side, in kart widths: from the ground beside the kart, bulging out a little as it climbs past
// the helmet; u runs 0 to 1 along it. The right side starts a beat later.
const WIND_PATH = Object.freeze({ out: 0.64, bulge: 0.18, inward: 0.14, lift: 0.08, climb: 1.18 });
const WIND_SIDE_DELAY_MS = 24;
// [behind the head, span, strength, outward shift in kart widths] for the two ribbons a side.
const WIND_RIBBONS = Object.freeze([[0, 0.45, 1, 0], [0.09, 0.3, 0.6, 0.1]]);
const WIND_STEPS = 12;
// The leaf rides the main ribbon just behind its head; its art leans, so it is turned by turn plus a little per side
// and along the climb.
const WIND_LEAF = Object.freeze({ size: 0.2, behindHead: 0.08, turn: -1.1, sideTurn: 0.25, climbTurn: 0.4 });

// The mud in V3's beats and kart widths, from the kart's ground point: two blobs fly in from the upper left and land
// under the kart, where the painted puddle bursts up behind it (KartLuckMarks), and four drops are thrown out from
// beside the kart in arcs, fading from MUD_SETTLE_FROM_MS as the puddle settles.
const MUD_LANDED_MS = DURATIONS.luckMudLandedMs;
const MUD_SETTLE_FROM_MS = 180;
// [from x, from y, to x, to y, radius]; V3 flies both at one angle.
const MUD_FLIGHTS = Object.freeze([[-0.93, -0.64, -0.16, 0.035, 0.055], [-1.05, -0.547, 0.06, 0.035, 0.047]]);
const MUD_FLIGHT_ANGLE = 0.6;
// [side, peak height, spread, radius]: a drop starts `from` out beside the kart, `below` the ground line, and
// travels `reach` × its spread further out.
const MUD_DROPS = Object.freeze([[-1, 0.29, 0.91, 0.045], [-1, 0.18, 1.1, 0.032], [1, 0.34, 0.97, 0.046], [1, 0.21, 1.15, 0.035]]);
const MUD_THROW = Object.freeze({ from: 0.38, reach: 0.45, below: 0.058 });

// The hit lands on the left of the shield bubble, a little above its middle; the server names no side, so it is
// always this one. Mud closes in until contactMs; the flash peaks from flashUpMs to flashHoldMs and is gone by
// flashGoneMs; the lit edge (edgeSpan either side of the hit) fades from edgeFadeMs to edgeGoneMs. Sizes are in kart
// widths.
const BLOCK = Object.freeze({
  angle: Math.PI * 1.1, contactMs: 90, flashUpMs: 115, flashHoldMs: 145, flashGoneMs: 260,
  edgeFadeMs: 160, edgeGoneMs: 390, edgeSpan: 0.48, impactSize: 0.48,
});
// [offset along the edge, radius] for the incoming blobs, which start `from` kart widths out and stop `to` out.
const BLOCK_MUD = Object.freeze({ from: 0.585, to: 0.055, blobs: [[-0.065, 0.052], [0.075, 0.043]] });
// [spread along the edge] for the mud thrown back out; each flies a little further than the last.
const BLOCK_SPRAY = Object.freeze([-0.65, -0.2, 0.25, 0.68]);
// [delay in ms]: two ripples, each running 200 ms from contactMs + 10.
const RIPPLE_DELAYS_MS = Object.freeze([0, 55]);
const RIPPLE_RUN_MS = 200;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
// How far a burst is through one of its beats: 0 before startMs, 1 from endMs on.
const beat = (ms, startMs, endMs) => clamp01((ms - startMs) / (endMs - startMs));
const lerp = (from, to, t) => from + (to - from) * t;

// Approved art at its own alpha. Graphics.texture takes its alpha from the fill style, which every fill leaves
// behind, so the alpha is set inside a saved state and the brush comes back as it was. The context's rotate turns
// any translate already made, so the art turns first and moves second.
function paintArt(g, texture, { x, y, width, alpha, rotation = 0, anchorX = 0.5, anchorY = 0.5 }) {
  const height = width * texture.height / texture.width;
  if (!(alpha > 0) || !(width > 0) || !(height > 0)) return;
  g.save().rotateTransform(rotation).translateTransform(x, y).setFillStyle({ alpha })
    .texture(texture, WHITE, -width * anchorX, -height * anchorY, width, height).restore();
}

// A soft round light: a faint wide disc under a brighter small one.
function drawGlow(g, x, y, radius, color, alpha) {
  if (!(alpha > 0) || !(radius > 0)) return;
  g.circle(x, y, radius).fill({ color, alpha: alpha * 0.5 });
  g.circle(x, y, radius * 0.55).fill({ color, alpha });
}

function drawEnergyOrb(g, { kart, luckArt }, progress) {
  const durationMs = DURATIONS.luckEnergyOrbEffectDurationMs;
  const ms = progress * durationMs;
  const ignite = easeOut(beat(ms, 0, ORB.ignitedMs));
  const out = beat(ms, ORB.fullUntilMs, durationMs);
  const alpha = 1 - out;
  if (alpha <= 0) return;
  const size = ORB.size * kart.artWidth;
  const { x, y } = kartLocalToScreen(kart, VEHICLE_UNIT_WIDTH / 2,
    kart.headTopY - ORB.gap * kart.artWidth - size / 2 - ORB.rise * kart.artWidth * easeOut(out));
  const side = size * kart.scale;
  const shown = side * (0.45 + 0.55 * ignite);
  const art = luckArt?.energyOrb;
  if (art != null) {
    paintArt(g, art, { x, y, width: shown, alpha });
  } else {
    const core = shown * LUCK_EFFECT_ART.energyOrb.cover / 2;
    g.circle(x, y, shown / 2).fill({ color: HALO, alpha: 0.2 * alpha });
    g.circle(x, y, core).fill({ color: GOLD, alpha });
    g.circle(x, y, core * 0.6).fill({ color: GOLD_LIGHT, alpha });
    g.circle(x - core * 0.35, y - core * 0.4, core * 0.22).fill({ color: WHITE, alpha: 0.8 * alpha });
  }
  drawGlow(g, x, y, side * 0.34, ORB_FLASH, 0.5 * (1 - beat(ms, ORB_FLASH_MS.fadeFromMs, ORB_FLASH_MS.goneMs)));
  const pulse = beat(ms, ORB_PULSE_MS.fromMs, ORB_PULSE_MS.toMs);
  if (pulse > 0 && pulse < 1) {
    g.circle(x, y, side * (0.24 + 0.3 * pulse))
      .stroke({ color: ORB_PULSE, alpha: 0.45 * (1 - pulse) * alpha, width: Math.max(1, kart.scale) });
  }
  ORB_MOTES.forEach(([sideSign, delayMs]) => {
    const drift = beat(ms, ORB_MOTE_MS.fromMs + delayMs, ORB_MOTE_MS.fromMs + delayMs + ORB_MOTE_MS.runMs);
    if (drift <= 0 || drift >= 1) return;
    const moteAlpha = Math.sin(Math.PI * drift) * alpha;
    const moteX = x + sideSign * side * (0.32 + 0.2 * drift);
    const moteY = y - side * (0.12 + 0.45 * drift);
    drawGlow(g, moteX, moteY, 4.4 * kart.scale, ORB_MOTE, 0.7 * moteAlpha);
    g.ellipse(moteX, moteY, 1.5 * kart.scale, 2.1 * kart.scale).fill({ color: WHITE, alpha: moteAlpha });
  });
}

// A point on one side's wind path, in kart-local units.
function windPoint(kart, side, u) {
  const { out, bulge, inward, lift, climb } = WIND_PATH;
  return {
    x: VEHICLE_UNIT_WIDTH / 2 + side * kart.artWidth * (out + bulge * Math.sin(Math.PI * u) - inward * u),
    y: VEHICLE_GROUND_Y + kart.artWidth * (lift - climb * u),
  };
}

// A ribbon of wind along part of its path: three bands (a soft glow, a light body, a white core), each swelling in
// the middle and tapering at both ends.
function drawRibbon(g, kart, side, from, to, strength, shift) {
  const points = Array.from({ length: WIND_STEPS + 1 }, (_, i) => {
    const { x, y } = windPoint(kart, side, lerp(from, to, i / WIND_STEPS));
    return kartLocalToScreen(kart, x + side * shift * kart.artWidth, y);
  });
  WIND_LAYERS.forEach(([width, color, opacity]) => {
    const edge = (sign) => points.map((point, i) => {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(after.x - before.x, after.y - before.y) || 1;
      // V3 draws its bands `width` px wide on a 90 px kart; here that is a share of the kart's own width.
      const half = sign * width * kart.artWidth / 90 * kart.scale * Math.sin(Math.PI * i / WIND_STEPS) / 2;
      return { x: point.x - (after.y - before.y) / length * half, y: point.y + (after.x - before.x) / length * half };
    });
    g.poly([...edge(1), ...edge(-1).reverse()]).fill({ color, alpha: opacity * strength });
  });
}

function drawTailwind(g, { kart, luckArt }, progress) {
  const durationMs = DURATIONS.luckTailwindEffectDurationMs;
  const ms = progress * durationMs;
  [-1, 1].forEach((side, index) => {
    const life = beat(ms, index * WIND_SIDE_DELAY_MS, durationMs);
    if (life <= 0 || life >= 1) return;
    const head = easeOut(life);
    const alpha = Math.sin(Math.PI * life);
    WIND_RIBBONS.forEach(([behind, span, strength, shift]) => {
      const ribbonHead = Math.max(0, head - behind);
      drawRibbon(g, kart, side, Math.max(0, ribbonHead - span), ribbonHead, alpha * strength, shift);
    });
    const leaf = luckArt?.windLeaf;
    if (leaf == null) return;
    const u = Math.max(0, head - WIND_LEAF.behindHead);
    const at = windPoint(kart, side, u);
    const point = kartLocalToScreen(kart, at.x, at.y);
    paintArt(g, leaf, { x: point.x, y: point.y, width: WIND_LEAF.size * kart.artWidth * kart.scale, alpha,
      rotation: WIND_LEAF.turn + side * WIND_LEAF.sideTurn + u * WIND_LEAF.climbTurn });
  });
}

// A blob of mud heading along `angle`. With the painted drop it is that drop, as thick as the drawn blob and as long as
// the painting; its head points right and its highlight up, so a drop heading left is mirrored, never turned over.
// Without it: a dark body, a lighter middle and a highlight, stretched along its flight.
export function drawMudBlob(g, { x, y }, radius, alpha, stretch = 1, angle = 0, art = null) {
  if (!(alpha > 0) || !(radius > 0)) return;
  if (art != null) {
    g.save().scaleTransform(1, Math.cos(angle) < 0 ? -1 : 1);
    paintArt(g, art, { x, y, width: 2 * radius * art.width / art.height, alpha, rotation: angle });
    g.restore();
    return;
  }
  g.save().rotateTransform(angle).translateTransform(x, y);
  g.ellipse(0, 0, radius * stretch, radius).fill({ color: MUD_DARK, alpha });
  g.ellipse(-radius * 0.2, -radius * 0.2, radius * 0.52, radius * 0.36).fill({ color: MUD, alpha });
  g.ellipse(-radius * 0.28, -radius * 0.35, radius * 0.19, radius * 0.12).fill({ color: MUD_LIGHT, alpha });
  g.restore();
}

// The burst's blobs and drops only: the puddle the blobs land in is painted behind the kart by KartLuckMarks.
function drawMudSplash(g, { kart, luckArt }, progress) {
  const durationMs = DURATIONS.luckMudEffectDurationMs;
  const ms = progress * durationMs;
  const kartWidth = kart.artWidth * kart.scale;
  const ground = kartLocalToScreen(kart, VEHICLE_UNIT_WIDTH / 2, VEHICLE_GROUND_Y);
  const at = (x, y) => ({ x: ground.x + x * kartWidth, y: ground.y + y * kartWidth });
  const drop = luckArt?.mudDrop;
  const flight = easeIn(beat(ms, 0, MUD_LANDED_MS));
  if (flight < 1) {
    MUD_FLIGHTS.forEach(([fromX, fromY, toX, toY, radius]) => {
      drawMudBlob(g, at(lerp(fromX, toX, flight), lerp(fromY, toY, flight)), radius * kartWidth, 1, 1.5,
        MUD_FLIGHT_ANGLE, drop);
    });
    return;
  }
  const thrown = beat(ms, MUD_LANDED_MS, durationMs);
  const alpha = 1 - beat(ms, MUD_SETTLE_FROM_MS, durationMs);
  MUD_DROPS.forEach(([side, height, spread, radius]) => {
    const point = at(side * (MUD_THROW.from + spread * MUD_THROW.reach * thrown),
      MUD_THROW.below - height * Math.sin(Math.PI * thrown));
    // Each drop heads along its arc: up and out as it leaves, down as it falls back.
    const heading = Math.atan2(-height * Math.PI * Math.cos(Math.PI * thrown), side * spread * MUD_THROW.reach);
    drawMudBlob(g, point, radius * kartWidth * (1 - 0.3 * thrown), alpha, 1.2, heading, drop);
  });
}

// The hit point on the bubble, its outward normal and the edge either side of it, in screen space.
function shieldContact(kart) {
  const centre = kartLocalToScreen(kart, KART_SHIELD_BUBBLE.x, KART_SHIELD_BUBBLE.y);
  const radiusX = KART_SHIELD_BUBBLE.radiusX * kart.scale;
  const radiusY = KART_SHIELD_BUBBLE.radiusY * kart.scale;
  const at = (angle) => ({ x: centre.x + radiusX * Math.cos(angle), y: centre.y + radiusY * Math.sin(angle) });
  const normalX = Math.cos(BLOCK.angle) / radiusX;
  const normalY = Math.sin(BLOCK.angle) / radiusY;
  const length = Math.hypot(normalX, normalY);
  return { at, radiusX, radiusY, point: at(BLOCK.angle), normal: { x: normalX / length, y: normalY / length } };
}

function drawShieldBlocked(g, { kart, luckArt }, progress) {
  const durationMs = DURATIONS.luckShieldBlockedEffectDurationMs;
  const ms = progress * durationMs;
  const { at, radiusX, radiusY, point, normal } = shieldContact(kart);
  const kartWidth = kart.artWidth * kart.scale;
  // A point `out` kart widths outward from the hit and `along` it on the edge.
  const away = (out, along) => ({
    x: point.x + (normal.x * out - normal.y * along) * kartWidth,
    y: point.y + (normal.y * out + normal.x * along) * kartWidth,
  });
  const inward = Math.atan2(-normal.y, -normal.x);
  const closing = easeIn(beat(ms, 0, BLOCK.contactMs));
  if (closing < 1) {
    BLOCK_MUD.blobs.forEach(([along, radius]) => {
      drawMudBlob(g, away(lerp(BLOCK_MUD.from, BLOCK_MUD.to, closing), along), radius * kartWidth, 1, 1.45, inward,
        luckArt?.mudDrop);
    });
    return;
  }
  // The shield's own edge lights up around the hit, and ripples spread from it into the bubble.
  const edge = 1 - beat(ms, BLOCK.edgeFadeMs, BLOCK.edgeGoneMs);
  if (edge > 0) {
    const from = at(BLOCK.angle - BLOCK.edgeSpan);
    const to = at(BLOCK.angle + BLOCK.edgeSpan);
    [[SKY, 0.3, 7], [ICE, 1, 2.5]].forEach(([color, alpha, width]) => {
      g.moveTo(from.x, from.y).arcToSvg(radiusX, radiusY, 0, 0, 1, to.x, to.y)
        .stroke({ color, alpha: alpha * edge, width: width * kart.scale, cap: "round" });
    });
  }
  RIPPLE_DELAYS_MS.forEach((delayMs) => {
    const spread = beat(ms, BLOCK.contactMs + 10 + delayMs, BLOCK.contactMs + 10 + delayMs + RIPPLE_RUN_MS);
    if (spread <= 0 || spread >= 1) return;
    // A flattened ring opening into the bubble: the hit is on its left wall, so the ring faces right.
    const radius = kartWidth * (0.05 + 0.25 * easeOut(spread));
    const rippleAt = (angle) => ({ x: point.x + radius * 0.6 * Math.cos(angle), y: point.y + radius * Math.sin(angle) });
    const start = rippleAt(-1.1);
    const end = rippleAt(1.1);
    g.moveTo(start.x, start.y).arcToSvg(radius * 0.6, radius, 0, 0, 1, end.x, end.y)
      .stroke({ color: RIPPLE, alpha: 0.65 * (1 - spread), width: Math.max(1, kart.scale) });
  });
  const flash = easeOut(beat(ms, BLOCK.contactMs, BLOCK.flashUpMs)) * (1 - beat(ms, BLOCK.flashHoldMs, BLOCK.flashGoneMs));
  if (flash > 0) {
    const art = luckArt?.shieldImpact;
    if (art != null) {
      const { anchorX, anchorY } = LUCK_EFFECT_ART.shieldImpact;
      paintArt(g, art, { x: point.x, y: point.y, width: BLOCK.impactSize * kartWidth, alpha: flash, rotation: inward,
        anchorX, anchorY });
    } else {
      g.star(point.x, point.y, 6, 22 * kart.scale, 5 * kart.scale, inward).fill({ color: ICE, alpha: flash });
      g.circle(point.x, point.y, 6 * kart.scale).fill({ color: WHITE, alpha: flash });
    }
  }
  // The mud flies back out, spreading along the edge.
  const thrown = beat(ms, BLOCK.contactMs, durationMs);
  if (thrown >= 1) return;
  BLOCK_SPRAY.forEach((spread, i) => {
    const drop = away(0.06 + (0.55 + 0.04 * i) * easeOut(thrown), spread * 0.48 * thrown);
    drawMudBlob(g, drop, (0.043 - 0.004 * i) * kartWidth * (1 - 0.35 * thrown), 1 - thrown, 1.25,
      Math.atan2(normal.y, normal.x) + spread, luckArt?.mudDrop);
  });
}

// Each burst hands the brush back as it found it, so art drawn after it in the same frame keeps its own alpha.
const keepingBrush = (draw) => (g, geometry, progress) => {
  g.save();
  draw(g, geometry, progress);
  g.restore();
};

export const LUCK_EFFECT_DRAWERS = Object.freeze({
  [STUDENT_RACE_EFFECT.LUCK_TAILWIND]: keepingBrush(drawTailwind),
  [STUDENT_RACE_EFFECT.LUCK_ENERGY_ORB]: keepingBrush(drawEnergyOrb),
  [STUDENT_RACE_EFFECT.LUCK_MUD]: keepingBrush(drawMudSplash),
  [STUDENT_RACE_EFFECT.LUCK_SHIELD_BLOCKED]: keepingBrush(drawShieldBlocked),
});
