import { Graphics } from "pixi.js";

import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";

/*
 * One-shot and ambient visual effects. F scope: dust puffs behind the kart,
 * intensity driven by visualSpeed. The playEffect(effectName) signature is
 * fixed NOW (names = STUDENT_RACE_EFFECT from the runtime constants) so the
 * answer flow (UI-10H) plugs in without changing this layer's API — the
 * correct/wrong/boost/finish implementations land there.
 */
const DUST_COLOR = 0xd9c39a;
const MAX_PUFFS = 36;
const PUFF_LIFE_MS = 700;
// New puffs per second at visualSpeed 1 (placeholder feel; tune freely).
const SPAWN_RATE_PER_SPEED = 9;

export class EffectsLayer {
  constructor(container) {
    this.kartConfig = STUDENT_RACE_VISUAL_CONFIG.playerKart;
    this.puffs = [];
    this.spawnAccumulator = 0;

    this.graphics = new Graphics();
    container.addChild(this.graphics);
  }

  /*
   * Future one-shot effects entry point (UI-10H wires this to
   * visual.activeEffect). Accepts a STUDENT_RACE_EFFECT name; unknown or
   * not-yet-implemented effects are deliberately ignored.
   */
  // eslint-disable-next-line no-unused-vars
  playEffect(effectName) {
    // Implemented in UI-10H (correct/wrong/boost/finish).
  }

  resize() {
    // Placement derives from frameState width/height on the next update.
  }

  update(frameState) {
    const { width, height, visualSpeed, deltaMs } = frameState;

    // Kart rear — dust origin, from the same config ratios the kart uses.
    const originX = width * this.kartConfig.screenXRatio;
    const originY = height * this.kartConfig.screenYRatio + height * 0.045;

    this.spawnPuffs(originX, originY, visualSpeed, deltaMs, width);
    this.agePuffs(deltaMs);
    this.drawPuffs(width);
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
  }
}
