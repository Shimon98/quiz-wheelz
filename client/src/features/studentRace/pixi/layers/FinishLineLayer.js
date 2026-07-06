import { Graphics } from "pixi.js";

/*
 * Finish-line placeholder: a checkered band lying on the road. Visibility
 * and placement come ENTIRELY from the unified track projection (F-1):
 * the band becomes visible exactly when the player's distance-to-go enters
 * the view window (perspective.viewDistanceAhead), entering at the horizon
 * and approaching the player with depth. First consumer of
 * perspective.projectTrackObject — future track objects (opponents, props)
 * follow the same path.
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

    const projected = perspective.projectTrackObject(
      totalDistance - visualPosition,
    );
    if (!projected.visible) return;

    this.isVisible = true;

    const t = projected.depth;
    const y = projected.y;
    const halfWidth = projected.roadHalfWidth;
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
