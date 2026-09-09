import { Container } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import {
  loadStudentRaceWorldTexture,
  WORLD_ASSET_STATUS,
} from "../assets/studentRaceWorldAssets";
import { buildProjectedStripMeshData } from "../utils/buildProjectedStripMeshData";
import { getLoopPhase } from "../utils/getLoopPhase";
import { ProjectedTextureStrip } from "../utils/ProjectedTextureStrip";

const SIDES = Object.freeze([-1, 1]);

export class MidBaseLayer {
  constructor(
    container,
    {
      loadWorldTexture = loadStudentRaceWorldTexture,
      enabled = STUDENT_RACE_WORLD_ART.midBase.enabled,
    } = {},
  ) {
    this.destroyed = false;
    this.texture = null;
    this.strips = null;

    this.container = new Container();
    container.addChild(this.container);

    this.ready = enabled ? this.requestTexture(loadWorldTexture) : Promise.resolve();
  }

  async requestTexture(loadWorldTexture) {
    const { assetUrl, maxAnisotropy } = STUDENT_RACE_WORLD_ART.midBase;
    const result = await loadWorldTexture(assetUrl, {
      repeat: true,
      mipmaps: true,
      maxAnisotropy,
    });

    if (this.destroyed || result.status !== WORLD_ASSET_STATUS.LOADED) {
      return;
    }
    this.texture = result.texture;
    this.strips = SIDES.map(
      (side) =>
        new ProjectedTextureStrip(this.container, result.texture, (frameState) =>
          this.buildSideData(side, frameState),
        ),
    );
  }

  resize() {}

  update(frameState) {
    if (this.strips == null) return;

    const art = STUDENT_RACE_WORLD_ART.midBase;
    const phase = getLoopPhase(frameState.worldOffset, art.tileWorldLength);
    const [left, right] = this.strips;
    left.sync(frameState, phase);
    right.sync(frameState, art.rightPhaseOffset - phase, -1);
  }

  buildSideData(side, { perspective, layout }) {
    const art = STUDENT_RACE_WORLD_ART.midBase;
    const { positionToPixelsRatio } = STUDENT_RACE_ANIMATION_CONFIG.serverUnits;
    const worldBottomY = layout.world.bottomY;

    return buildProjectedStripMeshData({
      rows: art.meshRows,
      columns: art.meshColumns,
      edgesAt: (t) => {
        const halfWidth = perspective.roadHalfWidthAt(t);
        const y = t === 1 ? worldBottomY : perspective.depthToY(t);
        const footX =
          perspective.centerX + side * halfWidth * (1 - art.footInset);
        return {
          startX: footX + side * halfWidth * art.lean,
          startY: y - halfWidth * art.heightRatio,
          endX: footX,
          endY: y,
        };
      },
      alongAt: (t) => (perspective.distanceAtDepth(t) * positionToPixelsRatio) / art.tileWorldLength,
      alongIsU: true,
    });
  }

  destroy() {
    this.destroyed = true;
    this.container.destroy({ children: true });
  }
}
