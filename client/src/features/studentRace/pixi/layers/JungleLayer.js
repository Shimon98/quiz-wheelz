import { Container, Graphics, Sprite } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { resolveFarHorizonPlacement } from "../../utils/resolveFarHorizonPlacement";
import {
  loadStudentRaceWorldTexture,
  WORLD_ASSET_STATUS,
} from "../assets/studentRaceWorldAssets";
import { buildGroundMeshData } from "../utils/buildGroundMeshData";
import { getLoopPhase } from "../utils/getLoopPhase";
import { ProjectedTextureStrip } from "../utils/ProjectedTextureStrip";

const SKY_HAZE_COLOR = 0xc9e8f2;
const FAR_JUNGLE_COLOR = 0x2e7d4f;
const MID_JUNGLE_COLOR = 0x3c9d5f;
const BUSH_COLOR = 0x2f8a4c;
const LEAF_COLOR = 0x256e3d;
const BUSHES_PER_SIDE = 4;
const GRADIENT_STRIPS = 48;

function mixColor(fromColor, toColor, ratio) {
  const channel = (shift) => {
    const from = (fromColor >> shift) & 0xff;
    const to = (toColor >> shift) & 0xff;
    return Math.round(from + (to - from) * ratio);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function drawVerticalGradient(g, width, top, height, fromColor, toColor) {
  const stripHeight = height / GRADIENT_STRIPS;
  for (let i = 0; i < GRADIENT_STRIPS; i += 1) {
    g.rect(0, top + stripHeight * i, width, stripHeight + 1).fill(
      mixColor(fromColor, toColor, i / (GRADIENT_STRIPS - 1)),
    );
  }
}

function drawVerticalFade(g, width, top, height, color, maxAlpha) {
  const stripHeight = height / GRADIENT_STRIPS;
  for (let i = 0; i < GRADIENT_STRIPS; i += 1) {
    const y0 = Math.round(top + stripHeight * i);
    const y1 = Math.round(top + stripHeight * (i + 1));
    g.rect(0, y0, width, y1 - y0).fill({
      color,
      alpha: maxAlpha * (1 - i / GRADIENT_STRIPS) ** 2,
    });
  }
}

export class JungleLayer {
  constructor(container, { loadWorldTexture = loadStudentRaceWorldTexture } = {}) {
    this.destroyed = false;
    this.farSprite = null;
    this.groundStrip = null;

    this.backdropGraphics = new Graphics();
    this.backdropSizeKey = null;
    this.groundContainer = new Container();
    this.mistGraphics = new Graphics();
    this.graphics = new Graphics();
    container.addChild(
      this.backdropGraphics,
      this.groundContainer,
      this.mistGraphics,
      this.graphics,
    );
    this.container = container;

    this.ready = Promise.all([
      this.requestFarTexture(loadWorldTexture),
      this.requestGroundTexture(loadWorldTexture),
    ]);
  }

  async requestFarTexture(loadWorldTexture) {
    const result = await loadWorldTexture(STUDENT_RACE_WORLD_ART.far.assetUrl);

    if (this.destroyed || result.status !== WORLD_ASSET_STATUS.LOADED) {
      return;
    }
    this.farSprite = new Sprite(result.texture);
    this.container.addChild(this.farSprite);
  }

  async requestGroundTexture(loadWorldTexture) {
    const { assetUrl, maxAnisotropy } = STUDENT_RACE_WORLD_ART.ground;
    const result = await loadWorldTexture(assetUrl, {
      repeat: true,
      mipmaps: true,
      maxAnisotropy,
    });

    if (this.destroyed || result.status !== WORLD_ASSET_STATUS.LOADED) {
      return;
    }
    this.groundStrip = new ProjectedTextureStrip(
      this.groundContainer,
      result.texture,
      (frameState) => this.buildGroundData(frameState),
    );
  }

  buildGroundData({ perspective, width, layout }) {
    const ground = STUDENT_RACE_WORLD_ART.ground;
    const { positionToPixelsRatio } = STUDENT_RACE_ANIMATION_CONFIG.serverUnits;

    return buildGroundMeshData({
      perspective,
      frameWidth: width,
      worldBottomY: layout.world.bottomY,
      positionToPixelsRatio,
      tileWorldLength: ground.tileWorldLength,
      tilesPerRoadWidth: ground.tilesPerRoadWidth,
      rows: ground.meshRows,
      columns: ground.meshColumns,
    });
  }

  resize() {}

  update(frameState) {
    const { perspective, width, worldOffset } = frameState;
    this.drawBackdrop(frameState);
    if (this.groundStrip != null) {
      const { tileWorldLength } = STUDENT_RACE_WORLD_ART.ground;
      this.groundStrip.sync(frameState, getLoopPhase(worldOffset, tileWorldLength));
    }
    const g = this.graphics;
    g.clear();

    if (this.farSprite != null) {
      this.placeFarSprite(frameState);
      return;
    }

    g.rect(
      0,
      perspective.horizonY * 0.72,
      width,
      perspective.horizonY * 0.28,
    ).fill(SKY_HAZE_COLOR);
    this.drawLegacyWorld(frameState);
  }

  drawBackdrop({ perspective, width, height, layout }) {
    const sizeKey = `${width}x${height}`;
    if (sizeKey === this.backdropSizeKey) return;
    this.backdropSizeKey = sizeKey;

    const { sky, ground } = STUDENT_RACE_WORLD_ART;
    const { horizonY } = perspective;
    const g = this.backdropGraphics;
    g.clear();
    drawVerticalGradient(g, width, 0, horizonY, sky.topColor, sky.horizonColor);
    drawVerticalGradient(
      g,
      width,
      horizonY,
      height - horizonY,
      ground.topColor,
      ground.bottomColor,
    );

    const mist = this.mistGraphics;
    mist.clear();
    drawVerticalFade(
      mist,
      width,
      horizonY,
      layout.world.bottomY * ground.mistWorldHeightRatio,
      ground.topColor,
      ground.mistMaxAlpha,
    );
  }

  placeFarSprite(frameState) {
    const { perspective, width } = frameState;
    const placement = resolveFarHorizonPlacement({
      centerX: perspective.centerX,
      frameWidth: width,
      horizonY: perspective.horizonY,
      textureWidth: this.farSprite.texture.width,
      textureHeight: this.farSprite.texture.height,
      farConfig: STUDENT_RACE_WORLD_ART.far,
    });

    this.farSprite.position.set(placement.x, placement.y);
    this.farSprite.width = placement.width;
    this.farSprite.height = placement.height;
  }

  drawLegacyWorld(frameState) {
    const { perspective, worldOffset, width } = frameState;
    const g = this.graphics;

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

    this.drawSideVegetation(
      g,
      perspective,
      worldOffset,
      BUSH_COLOR,
      0.5,
    );
    this.drawSideVegetation(
      g,
      perspective,
      worldOffset,
      LEAF_COLOR,
      1,
    );
  }

  drawTreeline(g, width, horizonY, bandHeight, color) {
    g.rect(0, horizonY - bandHeight, width, bandHeight).fill(color);

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

  drawSideVegetation(g, perspective, worldOffset, color, sizeFactor) {
    const viewWorldLength = perspective.viewDistanceAhead *
      STUDENT_RACE_ANIMATION_CONFIG.serverUnits.positionToPixelsRatio;
    const phase = getLoopPhase(worldOffset, viewWorldLength);

    for (let i = 0; i < BUSHES_PER_SIDE; i++) {
      const distance = getLoopPhase((i + sizeFactor) / BUSHES_PER_SIDE - phase, 1) *
        perspective.viewDistanceAhead;
      const t = perspective.depthAtDistance(distance);
      if (t <= 0.05) continue;

      const y = perspective.depthToY(t);
      const roadHalf = perspective.roadHalfWidthAt(t);
      const bushRadius = Math.max(4, roadHalf * 0.22 * sizeFactor);
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
    this.destroyed = true;
    this.farSprite?.destroy();
    this.groundContainer.destroy({ children: true });
    this.mistGraphics.destroy();
    this.backdropGraphics.destroy();
    this.graphics.destroy();
  }
}
