import { Assets, Graphics } from "pixi.js";

import { RACE_LUCK_EVENT_TYPES } from "../../../../constants/raceGameplayConstants";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";
import { presentedMoments } from "../../runtime/deriveStudentRaceMoments";
import { selectActiveLuckEffect } from "../../runtime/studentRaceGameplayMode";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { LUCK_EFFECT_ART } from "../assets/studentRaceEffectManifest";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../assets/studentRaceVehicleManifest";
import { drawFeedbackEffect } from "../effects/drawFeedbackEffect";
import { artPixelToKartLocal, playerKartFrame, VEHICLE_UNIT_WIDTH } from "../vehicles/studentRaceVehicleGeometry";

// The Luck art slots this layer draws its bursts with. The mud puddle's painting is KartLuckMarks' own: it lies
// behind the kart, under this layer.
const BURST_ART_SLOTS = Object.freeze(["energyOrb", "windLeaf", "mudDrop", "shieldImpact"]);
// Every hover kart shares the green master's art frame, so its measured helmet top and width hold for any color.
const KART_ART = STUDENT_RACE_VEHICLE_MANIFEST.TOY_CAR_GREEN;
const HEAD_TOP_Y = artPixelToKartLocal(KART_ART.headTop, { width: KART_ART.artSize, height: KART_ART.artSize }, KART_ART).y;
const ART_WIDTH = VEHICLE_UNIT_WIDTH * KART_ART.baseScale;

const DUST_COLOR = 0xd9c39a;
const MAX_PUFFS = 36;
const PUFF_LIFE_MS = 700;
const SPAWN_RATE_PER_SPEED = 9;

const { effects: EFFECT_CONFIG } = STUDENT_RACE_ANIMATION_CONFIG;
const EFFECT_DURATIONS_MS = Object.freeze({
  [STUDENT_RACE_EFFECT.CORRECT]: EFFECT_CONFIG.correctEffectDurationMs,
  [STUDENT_RACE_EFFECT.WRONG]: EFFECT_CONFIG.wrongEffectDurationMs,
  [STUDENT_RACE_EFFECT.BOOST]: EFFECT_CONFIG.boostEffectDurationMs,
  [STUDENT_RACE_EFFECT.FINISH]: EFFECT_CONFIG.finishEffectDurationMs,
  [STUDENT_RACE_EFFECT.TURBO_SUCCESS]: EFFECT_CONFIG.turboSuccessEffectDurationMs,
  [STUDENT_RACE_EFFECT.TURBO_FAILURE]: EFFECT_CONFIG.turboFailureEffectDurationMs,
  [STUDENT_RACE_EFFECT.SAFE_COMPLETE]: EFFECT_CONFIG.safeCompleteEffectDurationMs,
  [STUDENT_RACE_EFFECT.SAFE_PERFECT]: EFFECT_CONFIG.safePerfectEffectDurationMs,
  [STUDENT_RACE_EFFECT.LUCK_TAILWIND]: EFFECT_CONFIG.luckTailwindEffectDurationMs,
  [STUDENT_RACE_EFFECT.LUCK_ENERGY_ORB]: EFFECT_CONFIG.luckEnergyOrbEffectDurationMs,
  [STUDENT_RACE_EFFECT.LUCK_MUD]: EFFECT_CONFIG.luckMudEffectDurationMs,
  [STUDENT_RACE_EFFECT.LUCK_SHIELD_BLOCKED]: EFFECT_CONFIG.luckShieldBlockedEffectDurationMs,
});

export class EffectsLayer {
  constructor(container, { loadTexture = (url) => Assets.load(url), prepareTexture = null } = {}) {
    this.puffs = [];
    this.spawnAccumulator = 0;
    this.activeEffects = new Map();
    this.reducedMotion = false;
    this.destroyed = false;
    this.luckArt = {};

    this.graphics = new Graphics();
    this.feedbackGraphics = new Graphics();
    container.addChild(this.graphics, this.feedbackGraphics);
    this.artPromise = this.loadArt(loadTexture, prepareTexture);
  }

  // Art is decoration: it loads beside the world and is never waited for. A slot without a file asks for nothing,
  // and a file that fails, or arrives after the race screen is gone, leaves the Graphics drawing in place.
  loadArt(loadTexture, prepareTexture) {
    const slots = BURST_ART_SLOTS.filter((slot) => LUCK_EFFECT_ART[slot]?.url != null);
    return Promise.all(slots.map((slot) => new Promise((resolve) => resolve(loadTexture(LUCK_EFFECT_ART[slot].url)))
      .then((texture) => {
        if (this.destroyed || texture == null) return;
        prepareTexture?.(texture);
        this.luckArt[slot] = texture;
      })
      .catch(() => {})));
  }

  playEffect(effectName, { feedbackStreak = 0 } = {}) {
    if (this.destroyed || !Object.hasOwn(EFFECT_DURATIONS_MS, effectName)) {
      return;
    }

    const isFinish = effectName === STUDENT_RACE_EFFECT.FINISH;
    if (isFinish) {
      this.activeEffects.clear();
    } else if (this.activeEffects.has(STUDENT_RACE_EFFECT.FINISH)) {
      return;
    }

    this.activeEffects.set(effectName, {
      elapsedMs: 0,
      durationMs: EFFECT_DURATIONS_MS[effectName],
      feedbackStreak,
    });
  }

  playMoments(batch) {
    if (this.reducedMotion) return;
    presentedMoments(batch).forEach(({ type, streak = 0 }) => this.playEffect(type, { feedbackStreak: streak }));
  }

  resize() {}

  update(frameState) {
    if (this.destroyed) return;
    const { width, visualSpeed, deltaMs, layout, runtimeState, clientNowEpochMs,
      vehicleVisualScale = STUDENT_RACE_VISUAL_CONFIG.playerKart.visualScale } = frameState;
    const { anchorX, anchorY, maxWidth, dustOriginY } = layout.playerKart;
    const reducedMotion = runtimeState?.visual?.reducedMotion === true;

    this.reducedMotion = reducedMotion;
    if (reducedMotion) {
      this.puffs.length = 0;
      this.spawnAccumulator = 0;
      this.activeEffects.clear();
      this.graphics.clear();
      this.feedbackGraphics.clear();
      return;
    }
    this.agePuffs(deltaMs);
    // No dust rises from the mud puddle the kart sits in while a Mud window is open (KartLuckMarks, same rule).
    const inMud = selectActiveLuckEffect(runtimeState?.playerFinished ? null : runtimeState?.gameplay, clientNowEpochMs)
      === RACE_LUCK_EVENT_TYPES.MUD_SPLASH;
    this.spawnPuffs(anchorX, dustOriginY, inMud ? 0 : visualSpeed, deltaMs, width);
    this.drawPuffs(width);
    this.ageEffects(deltaMs);
    this.drawEffects({
      x: anchorX,
      y: anchorY,
      groundY: dustOriginY,
      bottomY: layout.world.bottomY,
      size: maxWidth,
      width,
      luckArt: this.luckArt,
      // The kart as drawn, which Luck bursts fit to; size above is the nominal kart width the older bursts use.
      kart: { ...playerKartFrame(layout, vehicleVisualScale), headTopY: HEAD_TOP_Y, artWidth: ART_WIDTH },
    });
  }

  ageEffects(deltaMs) {
    for (const [effect, state] of this.activeEffects) {
      state.elapsedMs += deltaMs;
      if (state.elapsedMs >= state.durationMs) {
        this.activeEffects.delete(effect);
      }
    }
  }

  drawEffects(geometry) {
    const g = this.feedbackGraphics;
    g.clear();
    for (const [effect, state] of this.activeEffects) {
      drawFeedbackEffect(g, effect, state.elapsedMs / state.durationMs, {
        ...geometry,
        feedbackStreak: state.feedbackStreak,
      });
    }
  }

  spawnPuffs(originX, originY, visualSpeed, deltaMs, width) {
    const accumulated = this.spawnAccumulator
      + (Math.abs(visualSpeed) * SPAWN_RATE_PER_SPEED * deltaMs) / 1000;
    const requested = Math.floor(accumulated);
    this.spawnAccumulator = accumulated - requested;
    const spawnCount = Math.min(requested, MAX_PUFFS - this.puffs.length);

    for (let i = 0; i < spawnCount; i += 1) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.puffs.push({
        x: originX + side * width * (0.06 + Math.random() * 0.06),
        y: originY + Math.random() * 6,
        driftX: side * (0.01 + Math.random() * 0.02),
        driftY: 0.03 + Math.random() * 0.03,
        ageMs: 0,
      });
    }
  }

  agePuffs(deltaMs) {
    this.puffs = this.puffs.filter((puff) => {
      puff.ageMs += deltaMs;
      puff.x += puff.driftX * deltaMs;
      puff.y += puff.driftY * deltaMs;
      return puff.ageMs < PUFF_LIFE_MS;
    });
  }

  drawPuffs(width) {
    const g = this.graphics;
    g.clear();

    for (const puff of this.puffs) {
      const progress = puff.ageMs / PUFF_LIFE_MS;
      const radius = width * 0.008 * (1 + progress * 2);
      g.circle(puff.x, puff.y, radius).fill({
        color: DUST_COLOR,
        alpha: 0.45 * (1 - progress),
      });
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.puffs.length = 0;
    this.activeEffects.clear();
    this.spawnAccumulator = 0;
    this.graphics.destroy();
    this.feedbackGraphics.destroy();
  }
}
