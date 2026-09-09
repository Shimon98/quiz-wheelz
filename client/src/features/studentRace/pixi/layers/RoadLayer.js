import { Container, Graphics } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import {
  loadStudentRaceWorldTexture,
  WORLD_ASSET_STATUS,
} from "../assets/studentRaceWorldAssets";
import { buildRoadMeshData } from "../utils/buildRoadMeshData";
import { getLoopPhase } from "../utils/getLoopPhase";
import { ProjectedTextureStrip } from "../utils/ProjectedTextureStrip";

const ROAD_COLOR = 0xc98f4e;
const WET_MUD_COLOR = 0xa9743c;
const PUDDLE_COLOR = 0x8c7a5b;
const STONE_COLOR = 0xb8a98f;
const CURB_RED = 0xd9503d;
const CURB_WHITE = 0xf5efe0;
const MIN_VISIBLE_DEPTH = 0.04;
const MUD_DETAIL_TYPES = ["patch", "puddle", "stone"];
const HAZE_LAYERS = 10;

export class RoadLayer {
  constructor(
    container,
    { road, viewDepthZones, loadWorldTexture = loadStudentRaceWorldTexture },
  ) {
    this.road = road;
    this.zones = viewDepthZones;
    this.destroyed = false;
    this.roadTexture = null;
    this.strip = null;
    this.hazeSizeKey = null;

    this.container = new Container();
    container.addChild(this.container);
    this.graphics = new Graphics();
    this.meshContainer = new Container();
    this.hazeGraphics = new Graphics();
    this.container.addChild(this.graphics, this.meshContainer, this.hazeGraphics);

    this.mudDetails = Array.from({ length: road.mudDetailCount }, (_, i) => ({
      lateralRatio: this.pseudoRandom(i * 2.17) * 1.5 - 0.75,
      sizeFactor: 0.05 + this.pseudoRandom(i * 3.71) * 0.08,
      type: MUD_DETAIL_TYPES[i % MUD_DETAIL_TYPES.length],
    }));

    this.ready = this.requestRoadTexture(loadWorldTexture);
  }

  async requestRoadTexture(loadWorldTexture) {
    const { assetUrl, maxAnisotropy, edgeFeatherHalfWidthRatio } = STUDENT_RACE_WORLD_ART.road;
    const result = await loadWorldTexture(assetUrl, {
      repeat: true,
      mipmaps: true,
      maxAnisotropy,
    });

    if (this.destroyed || result.status !== WORLD_ASSET_STATUS.LOADED) {
      return;
    }
    this.roadTexture = result.texture;
    this.strip = new ProjectedTextureStrip(
      this.meshContainer,
      result.texture,
      (frameState) => this.buildRoadData(frameState),
      { edgeFeatherHalfWidthRatio },
    );
  }

  get mesh() {
    return this.strip?.mesh ?? null;
  }

  buildRoadData({ perspective, layout }) {
    const { tileWorldLength, meshRows, meshColumns, surfaceInsetURatio } =
      STUDENT_RACE_WORLD_ART.road;
    const { positionToPixelsRatio } = STUDENT_RACE_ANIMATION_CONFIG.serverUnits;

    return buildRoadMeshData({
      perspective,
      worldBottomY: layout.world.bottomY,
      positionToPixelsRatio,
      tileWorldLength,
      rows: meshRows,
      columns: meshColumns,
      surfaceInsetURatio,
    });
  }

  pseudoRandom(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  resize() {}

  update(frameState) {
    if (this.roadTexture != null) {
      this.updateRoadMesh(frameState);
    } else {
      this.drawFallbackRoad(frameState);
    }
    this.drawHorizonHaze(frameState);
  }

  drawHorizonHaze(frameState) {
    const { perspective, width, height, layout } = frameState;
    const sizeKey = `${width}x${height}`;
    if (sizeKey === this.hazeSizeKey) return;
    this.hazeSizeKey = sizeKey;

    const {
      color,
      maxAlpha,
      aboveWorldHeightRatio,
      belowWorldHeightRatio,
      radiusXRatio,
    } = STUDENT_RACE_WORLD_ART.horizonHaze;
    const worldHeight = layout.world.bottomY;
    const above = worldHeight * aboveWorldHeightRatio;
    const below = worldHeight * belowWorldHeightRatio;
    const centerY = perspective.horizonY + (below - above) / 2;
    const radiusY = (above + below) / 2;
    const radiusX = perspective.widthUnit * radiusXRatio;
    const layerAlpha = 1 - (1 - maxAlpha) ** (1 / HAZE_LAYERS);

    const g = this.hazeGraphics;
    g.clear();
    for (let i = HAZE_LAYERS; i >= 1; i -= 1) {
      const scale = i / HAZE_LAYERS;
      g.ellipse(perspective.centerX, centerY, radiusX * scale, radiusY * scale)
        .fill({ color, alpha: layerAlpha });
    }
  }

  updateRoadMesh(frameState) {
    const { perspective, worldOffset, height, layout } = frameState;
    const { tileWorldLength, underPanelColor } = STUDENT_RACE_WORLD_ART.road;
    const worldBottomY = layout.world.bottomY;

    this.strip.sync(frameState, getLoopPhase(worldOffset, tileWorldLength));

    const g = this.graphics;
    g.clear();
    if (height > worldBottomY) {
      const bottomHalf = perspective.roadHalfWidthAt(1);
      g.rect(
        perspective.centerX - bottomHalf,
        worldBottomY,
        bottomHalf * 2,
        height - worldBottomY,
      ).fill(underPanelColor);
    }
  }

  drawFallbackRoad(frameState) {
    const { perspective, worldOffset, height, layout } = frameState;
    const g = this.graphics;
    g.clear();

    const worldBottomY = layout.world.bottomY;
    const topHalf = perspective.roadHalfWidthAt(0);
    const bottomHalf = perspective.roadHalfWidthAt(1);
    g.poly([
      perspective.centerX - topHalf,
      perspective.horizonY,
      perspective.centerX + topHalf,
      perspective.horizonY,
      perspective.centerX + bottomHalf,
      worldBottomY,
      perspective.centerX - bottomHalf,
      worldBottomY,
    ]).fill(ROAD_COLOR);

    if (height > worldBottomY) {
      g.rect(
        perspective.centerX - bottomHalf,
        worldBottomY,
        bottomHalf * 2,
        height - worldBottomY,
      ).fill(ROAD_COLOR);
    }

    const viewWorldLength = perspective.viewDistanceAhead *
      STUDENT_RACE_ANIMATION_CONFIG.serverUnits.positionToPixelsRatio;
    const phase = getLoopPhase(worldOffset, viewWorldLength);
    this.drawMudDetails(g, perspective, phase);
    this.drawCurbs(g, perspective, phase);
  }

  curbAlphaAt(tMid) {
    const nearStart = this.zones.near.minDepth;
    if (tMid <= nearStart) return 1;
    const fadeProgress = (tMid - nearStart) / (1 - nearStart);
    return Math.max(0, 1 - fadeProgress * 1.4);
  }

  drawCurbs(g, perspective, phase) {
    const segments = this.road.curbSegmentCount;

    for (let i = 0; i < segments; i++) {
      const nearDistance = getLoopPhase(i / segments - phase, 1) * perspective.viewDistanceAhead;
      const farDistance = Math.min(
        perspective.viewDistanceAhead,
        nearDistance + perspective.viewDistanceAhead / segments,
      );
      const t0 = perspective.depthAtDistance(farDistance);
      const t1 = perspective.depthAtDistance(nearDistance);
      if (t1 <= MIN_VISIBLE_DEPTH) continue;

      const alpha = this.curbAlphaAt((t0 + Math.min(t1, 1)) / 2);
      if (alpha <= 0) continue;

      const color = i % 2 === 0 ? CURB_RED : CURB_WHITE;
      const y0 = perspective.depthToY(t0);
      const y1 = perspective.depthToY(Math.min(t1, 1));
      const half0 = perspective.roadHalfWidthAt(t0);
      const half1 = perspective.roadHalfWidthAt(Math.min(t1, 1));
      const w0 = Math.max(2, half0 * 0.09);
      const w1 = Math.max(2, half1 * 0.09);

      g.poly([
        perspective.centerX - half0 - w0,
        y0,
        perspective.centerX - half0,
        y0,
        perspective.centerX - half1,
        y1,
        perspective.centerX - half1 - w1,
        y1,
      ]).fill({ color, alpha });

      g.poly([
        perspective.centerX + half0,
        y0,
        perspective.centerX + half0 + w0,
        y0,
        perspective.centerX + half1 + w1,
        y1,
        perspective.centerX + half1,
        y1,
      ]).fill({ color, alpha });
    }
  }

  drawMudDetails(g, perspective, phase) {
    const count = this.mudDetails.length;

    for (let i = 0; i < count; i++) {
      const detail = this.mudDetails[i];
      const distance = getLoopPhase(i / count - phase, 1) * perspective.viewDistanceAhead;
      const t = perspective.depthAtDistance(distance);
      if (t <= MIN_VISIBLE_DEPTH) continue;

      const y = perspective.depthToY(t);
      const halfWidth = perspective.roadHalfWidthAt(t);
      const x = perspective.centerX + halfWidth * detail.lateralRatio;
      const size = Math.max(2, halfWidth * detail.sizeFactor);

      if (detail.type === "patch") {
        g.ellipse(x, y, size * 1.7, size * 0.7).fill({
          color: WET_MUD_COLOR,
          alpha: 0.4,
        });
      } else if (detail.type === "puddle") {
        g.ellipse(x, y, size * 1.3, size * 0.55).fill({
          color: PUDDLE_COLOR,
          alpha: 0.5,
        });
      } else {
        g.circle(x, y, size * 0.5).fill({ color: STONE_COLOR, alpha: 0.8 });
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.container.destroy({ children: true });
  }
}
