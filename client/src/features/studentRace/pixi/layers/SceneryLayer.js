import { Sprite } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_SCENERY } from "../../config/sceneryConfig";
import {
  loadStudentRaceWorldTexture,
  WORLD_ASSET_STATUS,
} from "../assets/studentRaceWorldAssets";
import { projectSceneryPlacement } from "../utils/projectSceneryPlacement";

export class SceneryLayer {
  constructor(container, { loadWorldTexture = loadStudentRaceWorldTexture } = {}) {
    this.destroyed = false;
    this.items = null;

    this.container = container;
    this.container.sortableChildren = true;
    this.container.eventMode = "none";

    this.ready = this.requestTextures(loadWorldTexture);
  }

  async requestTextures(loadWorldTexture) {
    const { props, placements, bands } = STUDENT_RACE_SCENERY;
    const results = await Promise.all(
      Object.entries(props).map(async ([key, prop]) => [
        key,
        await loadWorldTexture(prop.assetUrl, { mipmaps: true }),
      ]),
    );
    if (this.destroyed) return;

    const textures = new Map(
      results
        .filter(([, result]) => result.status === WORLD_ASSET_STATUS.LOADED)
        .map(([key, result]) => [key, result.texture]),
    );
    this.items = placements.flatMap((placement) => {
      const texture = textures.get(placement.prop);
      if (texture == null) return [];

      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, props[placement.prop].anchorY ?? 1);
      sprite.visible = false;
      sprite.tint = bands[placement.band].tint;
      this.container.addChild(sprite);
      return [{ placement, sprite, prop: props[placement.prop] }];
    });
  }

  resize() {}

  update(frameState) {
    if (this.items == null) return;

    const { perspective, worldOffset, width, height } = frameState;
    const { bands } = STUDENT_RACE_SCENERY;
    const { positionToPixelsRatio } = STUDENT_RACE_ANIMATION_CONFIG.serverUnits;

    this.items.forEach(({ placement, sprite, prop }) => {
      const projected = projectSceneryPlacement(placement, {
        worldOffset,
        perspective,
        positionToPixelsRatio,
        band: bands[placement.band],
        widthPerRoadHalf: prop.widthPerRoadHalf,
        aspectRatio: sprite.texture.width / sprite.texture.height,
        anchorY: sprite.anchor.y,
        frameWidth: width,
        frameHeight: height,
      });
      sprite.visible = projected.visible;
      if (!projected.visible) return;

      const scale = projected.width / sprite.texture.width;
      sprite.position.set(projected.x, projected.y);
      sprite.scale.set(placement.flip ? -scale : scale, scale);
      sprite.alpha = projected.alpha;
      sprite.zIndex = projected.depth;
    });
  }

  destroy() {
    this.destroyed = true;
    this.items?.forEach(({ sprite }) => sprite.destroy());
  }
}
