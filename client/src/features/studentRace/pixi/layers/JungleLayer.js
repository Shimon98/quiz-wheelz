import { Graphics } from "pixi.js";

import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig";

/*
 * Jungle world background for the over-the-shoulder camera: sky + distant
 * jungle bands (almost static, like the reference art) and side vegetation
 * that flows down-and-outward along the depth axis — parallax here means
 * depth flow at different rates, not sideways scrolling.
 *
 * Placeholder drawing — colors die with this placeholder when real art
 * lands. Depth-flow rates come from raceVisualConfig.layers.
 */
const SKY_COLOR = 0x9ed4e8;
const SKY_HAZE_COLOR = 0xc9e8f2; // lighter band above the horizon
const FAR_JUNGLE_COLOR = 0x2e7d4f;
const MID_JUNGLE_COLOR = 0x3c9d5f;
const GROUND_COLOR = 0x59a662; // grass on both sides of the road
const BUSH_COLOR = 0x2f8a4c;
const LEAF_COLOR = 0x256e3d; // nearest, fastest side foliage
// Bush slots per side per ring (placeholder density).
const BUSHES_PER_SIDE = 4;
const DEPTH_CYCLE_WORLD_PX = 260; // matches the road's step feel

export class JungleLayer {
  constructor(container) {
    this.layersConfig = STUDENT_RACE_VISUAL_CONFIG.layers;
    this.graphics = new Graphics();
    container.addChild(this.graphics);
  }

  resize() {
    // All drawing derives from frameState.perspective on the next update.
  }

  update(frameState) {
    const { perspective, worldOffset, width, height } = frameState;
    const g = this.graphics;
    g.clear();

    // Sky down to the horizon, with a lighter haze band just above it.
    g.rect(0, 0, width, perspective.horizonY).fill(SKY_COLOR);
    g.rect(
      0,
      perspective.horizonY * 0.72,
      width,
      perspective.horizonY * 0.28,
    ).fill(SKY_HAZE_COLOR);

    // Distant jungle: two soft treeline bands sitting on the horizon —
    // effectively static, exactly like the far layers in the reference art.
    this.drawTreeline(
      g,
      width,
      perspective.horizonY,
      perspective.horizonY * 0.16,
      FAR_JUNGLE_COLOR,
    );
    this.drawTreeline(
      g,
      width,
      perspective.horizonY,
      perspective.horizonY * 0.08,
      MID_JUNGLE_COLOR,
    );

    // Ground on both sides of the road, horizon to bottom.
    g.rect(
      0,
      perspective.horizonY,
      width,
      height - perspective.horizonY,
    ).fill(GROUND_COLOR);

    // Side vegetation — two rings flowing at different depth rates.
    this.drawSideVegetation(
      g,
      perspective,
      worldOffset * this.layersConfig.jungleMidSpeedMultiplier,
      BUSH_COLOR,
      0.5,
    );
    this.drawSideVegetation(
      g,
      perspective,
      worldOffset * this.layersConfig.foregroundLeavesSpeedMultiplier,
      LEAF_COLOR,
      1,
    );
  }

  drawTreeline(g, width, horizonY, bandHeight, color) {
    g.rect(0, horizonY - bandHeight, width, bandHeight).fill(color);

    // Rounded treetop bumps along the band.
    const bumpCount = 9;
    const bumpSpacing = width / bumpCount;
    for (let i = 0; i <= bumpCount; i++) {
      g.ellipse(
        i * bumpSpacing,
        horizonY - bandHeight,
        bumpSpacing * 0.42,
        bandHeight * 0.55,
      ).fill(color);
    }
  }

  drawSideVegetation(g, perspective, scaledOffset, color, sizeFactor) {
    const phase = (((scaledOffset / DEPTH_CYCLE_WORLD_PX) % 1) + 1) % 1;

    for (let i = 0; i < BUSHES_PER_SIDE; i++) {
      const t = ((i + phase) % BUSHES_PER_SIDE) / BUSHES_PER_SIDE;
      if (t <= 0.05) continue;

      const y = perspective.depthToY(t);
      const roadHalf = perspective.roadHalfWidthAt(t);
      const bushRadius = Math.max(4, roadHalf * 0.22 * sizeFactor);
      // Sits just off the road edge, drifting outward as it gets closer.
      const outward = roadHalf + bushRadius * 1.4;

      g.ellipse(
        perspective.centerX - outward,
        y,
        bushRadius,
        bushRadius * 0.75,
      ).fill(color);
      g.ellipse(
        perspective.centerX + outward,
        y,
        bushRadius,
        bushRadius * 0.75,
      ).fill(color);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
