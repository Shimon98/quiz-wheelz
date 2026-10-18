import { Assets, Container, Graphics, Sprite } from "pixi.js";

import { KART_THRUSTER_CONFIG } from "../../config/kartThrusterConfig.js";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants.js";
import { artPixelToKartLocal, artScale } from "./studentRaceVehicleGeometry.js";
import { STUDENT_RACE_EFFECT_ART } from "../assets/studentRaceEffectManifest.js";

const FULL_TURN = Math.PI * 2;
const HALO_RINGS = Object.freeze([[1.6, 0.07], [1.2, 0.12]]);
const SPUTTER_STEPS = Object.freeze([[0.14, 1], [0.26, 0], [0.44, 1], [0.54, 0], [0.7, 1]]);
const easeOut = (t) => 1 - (1 - t) * (1 - t);

function sputterAlpha(progress) {
  const step = SPUTTER_STEPS.find(([until]) => progress < until);
  return step != null ? step[1] : Math.max(0, 1 - (progress - 0.7) / 0.3);
}

const ENVELOPES = Object.freeze({
  flare: (p, peakScale = 2.3) => ({
    scale: 1 + (peakScale - 1) * easeOut(Math.min(1, p / 0.35)),
    alpha: p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45,
  }),
  sputter: (p) => ({ scale: 1, alpha: sputterAlpha(p) }),
  settle: (p, peakScale) => ({ scale: 1 + (peakScale - 1) * Math.sin(Math.PI * p), alpha: Math.sin(Math.PI * p) ** 2 }),
});

function createNozzle(parent) {
  const container = new Container();
  const halo = new Graphics();
  const tongues = new Graphics();
  const core = new Graphics();
  const rays = new Graphics();
  const flame = new Sprite();
  flame.visible = false;
  container.addChild(halo, core, tongues, flame, rays);
  parent.addChild(container);
  return { container, halo, tongues, core, rays, flame };
}

// A quiet tapered fallback keeps a failed decorative asset from affecting gameplay.
function drawTongues(g, palette, radius) {
  g.moveTo(-radius * 0.55, 0)
    .bezierCurveTo(-radius, radius, -radius * 0.4, radius * 1.8, 0, radius * 2.7)
    .bezierCurveTo(radius * 0.35, radius * 1.5, radius * 0.8, radius, radius * 0.55, 0)
    .closePath().fill({ color: palette.tongues, alpha: 0.8 });
  g.ellipse(0, radius * 0.4, radius * 0.28, radius * 0.8).fill({ color: palette.tongueCore, alpha: 0.8 });
}

// Drawn once per palette or size change; frames only move, scale and fade it.
function drawNozzle({ halo, tongues, core, rays, flame }, palette, radius, texture) {
  halo.clear();
  tongues.clear();
  core.clear();
  rays.clear();
  flame.visible = false;
  tongues.visible = true;
  if (palette == null || radius <= 0) return;
  if (palette.halo != null) {
    HALO_RINGS.forEach(([scale, alpha]) => halo.circle(0, 0, radius * scale).fill({ color: palette.halo, alpha }));
  }
  core.circle(0, 0, radius * 0.78).fill({ color: palette.rim, alpha: 0.8 });
  core.circle(0, 0, radius * 0.57).fill({ color: palette.body, alpha: 0.9 });
  core.circle(0, 0, radius * 0.22).fill({ color: palette.hot, alpha: 0.9 });
  if (palette.rays != null) {
    rays.star(0, 0, KART_THRUSTER_CONFIG.rayPoints, radius * 2.1, radius * 0.7).fill({ color: palette.rays, alpha: 0.75 });
  }
  if (palette.tongues != null) {
    if (texture == null) drawTongues(tongues, palette, radius);
    else {
      const art = STUDENT_RACE_EFFECT_ART.turboExhaust;
      flame.texture = texture;
      flame.anchor.set(art.anchorX, art.anchorY);
      flame.width = radius * art.widthRadii;
      flame.height = radius * art.heightRadii;
      flame.visible = true;
      tongues.visible = false;
    }
  }
}

class GlowGroup {
  constructor(parent) {
    this.container = new Container();
    this.nozzles = [createNozzle(this.container), createNozzle(this.container)];
    this.palette = null;
    this.texture = null;
    this.radius = 0;
    parent.addChild(this.container);
  }

  draw(palette, radius) {
    this.palette = palette;
    this.radius = radius;
    this.nozzles.forEach((nozzle) => drawNozzle(nozzle, palette, radius, this.texture));
  }

  setTexture(texture) {
    this.texture = texture;
    this.draw(this.palette, this.radius);
  }

  place(points) {
    this.nozzles.forEach((nozzle, index) => nozzle.container.position.set(points[index].x, points[index].y));
  }

  look({ alpha, haloScale = 1, raysScale = 1, raysRotation = 0, coreScale = 1 }) {
    this.container.alpha = alpha;
    this.nozzles.forEach(({ halo, tongues, core, rays, flame }, index) => {
      halo.scale.set(haloScale);
      tongues.scale.set(raysScale);
      core.scale.set(coreScale);
      rays.scale.set(raysScale);
      rays.rotation = raysRotation;
      const art = STUDENT_RACE_EFFECT_ART.turboExhaust;
      flame.width = this.radius * art.widthRadii * (1 + (raysScale - 1) * 0.3);
      flame.height = this.radius * art.heightRadii * raysScale;
      flame.rotation = index === 0 ? 0.06 : -0.06;
    });
  }
}

export class KartThrusters {
  constructor(kart) {
    this.container = new Container();
    this.container.visible = false;
    this.steady = new GlowGroup(this.container);
    this.burst = new GlowGroup(this.container);
    this.radius = 0;
    this.placed = false;
    this.palette = null;
    this.level = 0;
    this.elapsedMs = 0;
    this.reducedMotion = false;
    this.oneShot = null;
    this.destroyed = false;
    this.artPromise = null;
    kart.addChild(this.container);
  }

  loadArt(loadTexture = (url) => Assets.load(url), prepareTexture) {
    if (this.artPromise != null) return this.artPromise;
    this.artPromise = Promise.resolve().then(() => loadTexture(STUDENT_RACE_EFFECT_ART.turboExhaust.url))
      .then((texture) => {
        if (this.destroyed || this.container.destroyed) return false;
        prepareTexture?.(texture);
        this.steady.setTexture(texture);
        this.burst.setTexture(texture);
        return true;
      }).catch(() => false);
    return this.artPromise;
  }

  place(definition, texture) {
    const points = definition?.thrusters;
    if (!Array.isArray(points) || points.length !== 2 || !(texture?.width > 0) || !(definition.thrusterRadius > 0)) {
      this.clear();
      return;
    }
    const local = points.map((point) => artPixelToKartLocal(point, texture, definition));
    this.radius = definition.thrusterRadius * artScale(texture.width, definition.baseScale)
      * KART_THRUSTER_CONFIG.coreCover;
    this.steady.place(local);
    this.burst.place(local);
    this.steady.draw(this.palette, this.radius);
    this.burst.draw(this.oneShot?.palette ?? null, this.radius);
    this.placed = true;
  }

  clear() {
    this.placed = false;
    this.container.visible = false;
  }

  play(type) {
    if (type === STUDENT_RACE_EFFECT.FINISH) {
      this.stopOneShot();
      return;
    }
    const shot = KART_THRUSTER_CONFIG.oneShots[type];
    if (shot == null || this.reducedMotion) return;
    this.oneShot = { type, elapsedMs: 0, ...shot };
    this.burst.draw(shot.palette, this.radius);
  }

  stopOneShot() {
    this.oneShot = null;
    this.burst.draw(null, this.radius);
  }

  update({ deltaMs, palette, reducedMotion }) {
    this.elapsedMs += deltaMs;
    this.reducedMotion = reducedMotion;
    if (reducedMotion && this.oneShot != null) this.stopOneShot();
    this.updateSteady(deltaMs, palette, reducedMotion);
    this.updateOneShot(deltaMs);
    this.container.visible = this.placed && (this.level > 0 || this.oneShot != null);
  }

  updateSteady(deltaMs, palette, reducedMotion) {
    if (palette != null && palette !== this.palette) this.steady.draw(palette, this.radius);
    if (palette != null) this.palette = palette;
    const target = palette != null ? 1 : 0;
    const step = deltaMs / (target > this.level ? KART_THRUSTER_CONFIG.fadeInMs : KART_THRUSTER_CONFIG.fadeOutMs);
    this.level = reducedMotion ? target : Math.min(1, Math.max(0, this.level + Math.sign(target - this.level) * step));
    if (Math.abs(target - this.level) < step) this.level = target;
    if (this.level === 0 && palette == null && this.palette != null) {
      this.palette = null;
      this.steady.draw(null, this.radius);
    }
    this.steady.look({ alpha: this.level * (this.palette?.opacity ?? 1), ...this.steadyMotion(reducedMotion) });
  }

  flicker() {
    const { periodsMs, depths } = KART_THRUSTER_CONFIG.flicker;
    return 1 + periodsMs.reduce((sum, period, i) => sum + depths[i] * Math.sin((this.elapsedMs / period) * FULL_TURN), 0);
  }

  steadyMotion(reducedMotion) {
    if (reducedMotion || this.palette == null) return {};
    const t = this.elapsedMs;
    if (this.palette.rays != null || this.palette.tongues != null) {
      const flicker = this.flicker();
      return {
        haloScale: flicker,
        raysScale: flicker * 1.05,
        raysRotation: t * KART_THRUSTER_CONFIG.flicker.spinPerMs,
        coreScale: 1 + (flicker - 1) * 0.2,
      };
    }
    const { periodMs, depth } = KART_THRUSTER_CONFIG.breathe;
    return { haloScale: 1 - depth / 2 + (depth / 2) * Math.sin((t / periodMs) * FULL_TURN) };
  }

  updateOneShot(deltaMs) {
    if (this.oneShot == null) return;
    this.oneShot.elapsedMs += deltaMs;
    const progress = this.oneShot.elapsedMs / this.oneShot.durationMs;
    if (progress >= 1) {
      this.stopOneShot();
      return;
    }
    const { envelope, peakScale, haloPeakScale = peakScale } = this.oneShot;
    const { scale, alpha } = ENVELOPES[envelope](progress, peakScale);
    this.steady.container.alpha *= 1 - alpha;
    this.burst.look({
      alpha: alpha * (this.oneShot.palette.opacity ?? 1),
      haloScale: ENVELOPES[envelope](progress, haloPeakScale).scale,
      raysScale: scale * this.flicker(),
      raysRotation: this.elapsedMs * KART_THRUSTER_CONFIG.flicker.spinPerMs * 3,
      coreScale: 1 + (scale - 1) * 0.25,
    });
  }

  destroy() {
    this.destroyed = true;
    this.container.destroy({ children: true });
  }
}
