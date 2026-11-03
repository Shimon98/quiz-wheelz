import { Assets, Container, Graphics, Sprite } from "pixi.js";

import { STUDENT_RACE_FINISH_GATE } from "../../config/finishGateConfig";
import { STUDENT_RACE_EFFECT_ART } from "../assets/studentRaceEffectManifest";

const SIDES = Object.freeze([-1, 1]);

export class FinishLineLayer {
  constructor(container, { loadTexture = (url) => Assets.load(url), prepareTexture = null } = {}) {
    this.isVisible = false;
    this.gate = new Container();
    this.gate.eventMode = "none";
    this.gate.visible = false;
    this.graphics = new Graphics();
    this.gate.addChild(this.graphics);
    container.addChild(this.gate);
    this.drawGate();
    this.artPromise = this.loadArt(loadTexture, prepareTexture);
  }

  // Astra's painted gate takes the drawn one's place once it loads, pinned like the effect art, its feet where the
  // drawn poles stand; a failed or late load keeps the drawn gate. The race never waits for it.
  loadArt(loadTexture, prepareTexture) {
    const { url, anchorX, anchorY, feetApart } = STUDENT_RACE_EFFECT_ART.finishGate;
    if (url == null) return Promise.resolve(false);
    return Promise.resolve().then(() => loadTexture(url)).then((texture) => {
      if (texture == null || this.gate.destroyed) return false;
      prepareTexture?.(texture);
      const art = new Sprite(texture);
      art.anchor.set(anchorX, anchorY);
      art.scale.set(2 * STUDENT_RACE_FINISH_GATE.poleLateralRatio / (feetApart * texture.width));
      this.gate.addChild(art);
      this.graphics.visible = false;
      return true;
    }).catch(() => false);
  }

  drawGate() {
    const config = STUDENT_RACE_FINISH_GATE;
    const g = this.graphics;
    const { colors } = config;

    SIDES.forEach((side) => {
      const x = side * config.poleLateralRatio;
      g.ellipse(x, config.shadowHeight, config.shadowWidth, config.shadowHeight)
        .fill({ color: colors.outline, alpha: config.shadowAlpha });
      g.moveTo(x, -config.height + config.braceDrop)
        .lineTo(x - side * config.braceReach, -config.height)
        .stroke({ color: colors.gold, width: config.braceWidth });
      g.roundRect(
        x - config.poleWidth / 2,
        -config.height,
        config.poleWidth,
        config.height,
        config.poleWidth / 2,
      ).fill(colors.outline);
      g.rect(
        x - config.poleWidth / 2 + config.poleWidth * config.poleHighlightInsetRatio,
        -config.height,
        config.poleWidth * (1 - config.poleHighlightInsetRatio * 2),
        config.height,
      ).fill(colors.post);
      g.rect(
        x - config.poleWidth / 2 + config.poleWidth * config.poleHighlightInsetRatio,
        -config.height,
        config.poleWidth * config.poleHighlightWidthRatio,
        config.height,
      ).fill(colors.postLight);
      g.roundRect(
        x - config.baseWidth / 2,
        -config.baseHeight,
        config.baseWidth,
        config.baseHeight,
        config.baseHeight / 2,
      ).fill(colors.gold);
      g.circle(x, -config.height, config.poleCapRadius).fill(colors.gold);
      g.circle(x, -config.height, config.poleCapRadius / 2).fill(colors.goldLight);
    });

    this.drawBanner(config);
  }

  drawBanner(config) {
    const g = this.graphics;
    const { colors, bannerBorder, bannerHeight, checkerColumns, checkerRows } = config;
    const halfWidth = config.poleLateralRatio + config.bannerOverhang;
    const top = -config.height;
    g.roundRect(
      -halfWidth,
      top + config.bannerShadowOffset,
      halfWidth * 2,
      bannerHeight,
      config.bannerRadius,
    ).fill(colors.frameShadow);
    g.roundRect(-halfWidth, top, halfWidth * 2, bannerHeight, config.bannerRadius)
      .fill(colors.gold);

    const left = -halfWidth + bannerBorder;
    const innerTop = top + bannerBorder;
    const innerWidth = halfWidth * 2 - bannerBorder * 2;
    const innerHeight = bannerHeight - bannerBorder * 2;
    const cellWidth = innerWidth / checkerColumns;
    const cellHeight = innerHeight / checkerRows;

    for (let row = 0; row < checkerRows; row += 1) {
      for (let column = 0; column < checkerColumns; column += 1) {
        const color = (row + column) % 2 === 0 ? colors.checkerDark : colors.checkerLight;
        g.rect(left + column * cellWidth, innerTop + row * cellHeight, cellWidth, cellHeight)
          .fill(color);
      }
    }
  }

  resize() {}

  update({ perspective, raceObjectCameraPosition, runtimeState }) {
    const totalDistance = runtimeState?.totalDistance;
    const projected = totalDistance == null
      ? null
      : perspective.projectTrackObject(totalDistance - raceObjectCameraPosition);
    this.isVisible = projected?.visible === true;
    this.gate.visible = this.isVisible;
    if (!this.isVisible) return;

    this.gate.position.set(projected.x, projected.y);
    this.gate.scale.set(projected.roadHalfWidth);
    this.gate.zIndex = projected.depth;
  }

  destroy() {
    this.gate.destroy({ children: true });
  }
}
