import { Graphics } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";
import { detectRuntimeEffectTriggers } from "../effects/detectRuntimeEffectTriggers";
import { drawFeedbackEffect } from "../effects/drawFeedbackEffect";

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
});

export class EffectsLayer {
  constructor(container) {
    this.puffs = [];
    this.spawnAccumulator = 0;
    this.activeEffects = new Map();
    this.observedRuntime = null;

    this.graphics = new Graphics();
    this.feedbackGraphics = new Graphics();
    container.addChild(this.graphics, this.feedbackGraphics);
  }

  playEffect(effectName) {
    if (!Object.hasOwn(EFFECT_DURATIONS_MS, effectName)) {
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
    });
  }

  resize() {}

  update(frameState) {
    const { width, visualSpeed, deltaMs, layout, runtimeState } = frameState;
    const { anchorX, anchorY, maxWidth, dustOriginY } = layout.playerKart;

    this.observeRuntime(runtimeState);
    this.spawnPuffs(anchorX, dustOriginY, visualSpeed, deltaMs, width);
    this.agePuffs(deltaMs);
    this.drawPuffs(width);
    this.ageEffects(deltaMs);
    this.drawEffects({
      x: anchorX,
      y: anchorY,
      groundY: dustOriginY,
      bottomY: layout.world.bottomY,
      size: maxWidth,
      width,
    });
  }

  observeRuntime(runtimeState) {
    const { observed, effects } = detectRuntimeEffectTriggers(
      this.observedRuntime,
      runtimeState,
    );
    this.observedRuntime = observed;
    effects.forEach((effect) => this.playEffect(effect));
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
      drawFeedbackEffect(g, effect, state.elapsedMs / state.durationMs, geometry);
    }
  }

  spawnPuffs(originX, originY, visualSpeed, deltaMs, width) {
    this.spawnAccumulator +=
      (Math.abs(visualSpeed) * SPAWN_RATE_PER_SPEED * deltaMs) / 1000;

    while (this.spawnAccumulator >= 1 && this.puffs.length < MAX_PUFFS) {
      this.spawnAccumulator -= 1;
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
    this.graphics.destroy();
    this.feedbackGraphics.destroy();
  }
}
