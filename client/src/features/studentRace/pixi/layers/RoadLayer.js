import { Graphics } from "pixi.js";

/*
 * Wide muddy jungle track (locked track model, F-2): ONE lane-agnostic road,
 * symmetric around the screen center for EVERY player — server lanes are
 * invisible relative slots for future opponents and are never drawn. Near
 * the player the road is wider than the frame (edges off-screen); curbs and
 * edges fade in from the mid zone toward the horizon, driven by the LIVE
 * viewDepthZones config (this layer is its first consumer — future opponent
 * visibility caps join the same zones).
 *
 * NO lane lines, NO center markers, NO numbers. Road texture comes from
 * scattered mud details (wet patches, puddles, stones) flowing with depth —
 * scattered laterally on purpose so nothing reads as a lane marking.
 *
 * Placeholder drawing — colors/densities die with the real road asset.
 */
const ROAD_COLOR = 0xc98f4e; // dry mud
const WET_MUD_COLOR = 0xa9743c; // darker wet patches
const PUDDLE_COLOR = 0x8c7a5b; // muddy water
const STONE_COLOR = 0xb8a98f;
const CURB_RED = 0xd9503d;
const CURB_WHITE = 0xf5efe0;
// World-pixels of forward travel per curb/detail step (placeholder motion
// density; the real unit conversion lives in raceAnimationConfig).
const DEPTH_CYCLE_WORLD_PX = 260;
// Skip elements too close to the horizon — sub-pixel noise otherwise.
const MIN_VISIBLE_DEPTH = 0.04;
const MUD_DETAIL_TYPES = ["patch", "puddle", "stone"];

export class RoadLayer {
  constructor(container, { road, viewDepthZones }) {
    this.road = road;
    this.zones = viewDepthZones;
    this.graphics = new Graphics();
    container.addChild(this.graphics);

    // Index-seeded scatter — deterministic, so details never flicker
    // between frames and never line up into anything lane-like.
    this.mudDetails = Array.from({ length: road.mudDetailCount }, (_, i) => ({
      lateralRatio: this.pseudoRandom(i * 2.17) * 1.5 - 0.75,
      sizeFactor: 0.05 + this.pseudoRandom(i * 3.71) * 0.08,
      type: MUD_DETAIL_TYPES[i % MUD_DETAIL_TYPES.length],
    }));
  }

  // Deterministic 0..1 noise from an index (classic sin-hash) — a stable
  // placeholder scatter with zero per-frame randomness.
  pseudoRandom(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  resize() {
    // All drawing derives from frameState.perspective on the next update.
  }

  update(frameState) {
    const { perspective, worldOffset, height, layout } = frameState;
    const g = this.graphics;
    g.clear();

    // Road surface — trapezoid from horizon to the visible world's bottom
    // (the question panel's overlap line, layout contract G). With
    // roadBottomWidthRatio > 1 the near edges live OFF-screen, so up close
    // the road is mud from edge to edge, exactly per the track model.
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

    // Continue the surface down behind the question panel, so the world
    // never shows a seam where the panel's rounded corners reveal it.
    if (height > worldBottomY) {
      g.rect(
        perspective.centerX - bottomHalf,
        worldBottomY,
        bottomHalf * 2,
        height - worldBottomY,
      ).fill(ROAD_COLOR);
    }

    const phase = this.depthPhase(worldOffset);
    this.drawMudDetails(g, perspective, phase);
    this.drawCurbs(g, perspective, phase);
  }

  depthPhase(worldOffset) {
    const raw = (worldOffset / DEPTH_CYCLE_WORLD_PX) % 1;
    return raw < 0 ? raw + 1 : raw;
  }

  /*
   * Curbs read mainly in the mid/far zones: full strength up to the near
   * zone's edge, then fade out toward the player (where the road edges are
   * off-screen anyway). Zone boundary comes from viewDepthZones — the same
   * split future opponent visibility will use.
   */
  curbAlphaAt(tMid) {
    const nearStart = this.zones.near.minDepth;
    if (tMid <= nearStart) return 1;
    const fadeProgress = (tMid - nearStart) / (1 - nearStart);
    return Math.max(0, 1 - fadeProgress * 1.4);
  }

  drawCurbs(g, perspective, phase) {
    const segments = this.road.curbSegmentCount;

    for (let i = 0; i < segments; i++) {
      const t0 = ((i + phase) % segments) / segments;
      const t1 = t0 + 1 / segments;
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
      const t = ((i + phase) % count) / count;
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
    this.graphics.destroy();
  }
}
