import { Graphics } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";

/*
 * Finish-line placeholder: a checkered band lying on the road, visible only
 * when totalDistance is known AND distance-to-go drops under the reveal
 * threshold (raceAnimationConfig.finishLine). It enters at the horizon and
 * approaches the player with depth.
 *
 * This layer only DISPLAYS the line — it never decides that the player
 * finished; a real finish arrives from the server (playerStatus /
 * playerFinished).
 *
 * Dev note: with the local runtime the position WRAPS at the track end, so
 * the finish line appears cyclically during development — expected, not a
 * bug.
 */
const CHECKER_DARK = 0x212529;
const CHECKER_LIGHT = 0xf8f9fa;
const CHECKER_COLUMNS = 10;

export class FinishLineLayer {
  constructor(container) {
    this.finishConfig = STUDENT_RACE_ANIMATION_CONFIG.finishLine;
    this.isVisible = false;

    this.graphics = new Graphics();
    container.addChild(this.graphics);
  }

  resize() {
    // Placement derives from frameState.perspective on the next update.
  }

  update(frameState) {
    const { perspective, visualPosition, runtimeState } = frameState;
    const g = this.graphics;
    g.clear();
    this.isVisible = false;

    // No totalDistance yet (the server hasn't said) -> no finish line at all.
    const totalDistance = runtimeState?.totalDistance;
    if (totalDistance == null) return;

    const distanceToFinish = totalDistance - visualPosition;
    const reveal = this.finishConfig.revealDistanceFromFinish;
    if (distanceToFinish > reveal || distanceToFinish < 0) return;

    this.isVisible = true;

    // 0 at the reveal edge (horizon) -> 1 when the player reaches it.
    const t = 1 - distanceToFinish / reveal;
    const y = perspective.depthToY(t);
    const halfWidth = perspective.roadHalfWidthAt(t);
    const bandHeight = Math.max(4, 22 * t);
    const cellWidth = (halfWidth * 2) / CHECKER_COLUMNS;
    const rowHeight = bandHeight / 2;

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < CHECKER_COLUMNS; column++) {
        const color =
          (row + column) % 2 === 0 ? CHECKER_DARK : CHECKER_LIGHT;
        g.rect(
          perspective.centerX - halfWidth + column * cellWidth,
          y - bandHeight / 2 + row * rowHeight,
          cellWidth,
          rowHeight,
        ).fill(color);
      }
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
