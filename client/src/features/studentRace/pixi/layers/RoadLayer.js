import { Graphics } from "pixi.js";

/*
 * Pseudo-perspective road (the F camera decision): a trapezoid converging to
 * the vanishing point, with red/white curbs and center markers flowing from
 * the horizon toward the player. Movement here is DEPTH movement — nothing
 * scrolls vertically as a flat texture.
 *
 * Knows nothing about game rules; consumes only frameState (worldOffset +
 * perspective helpers built by the renderer from raceVisualConfig.camera).
 *
 * Placeholder drawing — colors/densities below die together with this
 * placeholder when the real road asset lands, so they live here, not in
 * config.
 */
const ROAD_COLOR = 0xc98f4e; // dirt road
const CURB_RED = 0xd9503d;
const CURB_WHITE = 0xf5efe0;
const MARKER_COLOR = 0xe6cf9d; // faint center track marks
// World-pixels of forward travel per one curb-segment step (placeholder
// motion density; the real unit conversion lives in raceAnimationConfig).
const DEPTH_CYCLE_WORLD_PX = 260;
// Skip elements too close to the horizon — sub-pixel noise otherwise.
const MIN_VISIBLE_DEPTH = 0.04;

export class RoadLayer {
  constructor(container, { road }) {
    this.road = road;
    this.graphics = new Graphics();
    container.addChild(this.graphics);
  }

  resize() {
    // All drawing derives from frameState.perspective on the next update.
  }

  update(frameState) {
    const { perspective, worldOffset, height } = frameState;
    const g = this.graphics;
    g.clear();

    // Road surface — trapezoid from horizon to screen bottom.
    const topHalf = perspective.roadHalfWidthAt(0);
    const bottomHalf = perspective.roadHalfWidthAt(1);
    g.poly([
      perspective.centerX - topHalf,
      perspective.horizonY,
      perspective.centerX + topHalf,
      perspective.horizonY,
      perspective.centerX + bottomHalf,
      height,
      perspective.centerX - bottomHalf,
      height,
    ]).fill(ROAD_COLOR);

    // Depth phase: one full unit = one segment step toward the viewer.
    const phase = this.depthPhase(worldOffset);

    this.drawCurbs(g, perspective, phase);
    this.drawCenterMarkers(g, perspective, phase);
  }

  depthPhase(worldOffset) {
    const raw = (worldOffset / DEPTH_CYCLE_WORLD_PX) % 1;
    return raw < 0 ? raw + 1 : raw;
  }

  drawCurbs(g, perspective, phase) {
    const segments = this.road.curbSegmentCount;

    for (let i = 0; i < segments; i++) {
      const t0 = ((i + phase) % segments) / segments;
      const t1 = t0 + 1 / segments;
      if (t1 <= MIN_VISIBLE_DEPTH) continue;

      const color = i % 2 === 0 ? CURB_RED : CURB_WHITE;
      const y0 = perspective.depthToY(t0);
      const y1 = perspective.depthToY(Math.min(t1, 1));
      const half0 = perspective.roadHalfWidthAt(t0);
      const half1 = perspective.roadHalfWidthAt(Math.min(t1, 1));
      // Curb thickness grows with proximity, like everything else.
      const w0 = Math.max(2, half0 * 0.09);
      const w1 = Math.max(2, half1 * 0.09);

      // Start-side curb.
      g.poly([
        perspective.centerX - half0 - w0,
        y0,
        perspective.centerX - half0,
        y0,
        perspective.centerX - half1,
        y1,
        perspective.centerX - half1 - w1,
        y1,
      ]).fill(color);

      // End-side curb.
      g.poly([
        perspective.centerX + half0,
        y0,
        perspective.centerX + half0 + w0,
        y0,
        perspective.centerX + half1 + w1,
        y1,
        perspective.centerX + half1,
        y1,
      ]).fill(color);
    }
  }

  drawCenterMarkers(g, perspective, phase) {
    const markers = this.road.depthMarkerCount;

    for (let i = 0; i < markers; i++) {
      const t = ((i + phase) % markers) / markers;
      if (t <= MIN_VISIBLE_DEPTH) continue;

      const y = perspective.depthToY(t);
      const dashWidth = Math.max(2, perspective.roadHalfWidthAt(t) * 0.08);
      const dashHeight = Math.max(2, dashWidth * 2.2);
      g.roundRect(
        perspective.centerX - dashWidth / 2,
        y - dashHeight / 2,
        dashWidth,
        dashHeight,
        dashWidth / 3,
      ).fill({ color: MARKER_COLOR, alpha: 0.7 });
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
