import { Container, Graphics } from "pixi.js";

import {
  loadStudentRaceVehicleAssets,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";

/*
 * The student's kart — SCREEN-FIXED at the anchors from
 * frameState.layout.playerKart (layout contract, G): anchored inside the
 * VISIBLE world area above the question panel, never a raw-screen ratio.
 * The world moves, the kart doesn't. Only cosmetic motion is allowed here
 * (speed bob/tilt), never movement derived from position.
 *
 * Placeholder drawing (a simple kart only, no monkey-from-shapes — the real
 * art replaces this wholesale). Drawn once at unit size, then scaled.
 */
const KART_BODY_COLOR = 0x37b24d;
const KART_STRIPE_COLOR = 0x2b8a3e;
const WHEEL_COLOR = 0x212529;
const HELMET_COLOR = 0x339af0;
const SHADOW_COLOR = 0x1d3557;
// Unit-size drawing base (scaled to the configured width ratio per frame).
const UNIT_WIDTH = 100;
const UNIT_HEIGHT = 64;
// Cosmetic bob: subtle, speed-driven.
const BOB_FREQUENCY_MS = 95;
const BOB_MAX_PX = 2.5;

export class PlayerKartLayer {
  constructor(container, { loadVehicleAssets = loadStudentRaceVehicleAssets } = {}) {
    this.elapsedMs = 0;

    // Vehicle art lifecycle (C1-06C): the layer owns which key is displayed.
    // loadedVehicleArt stays null until a load succeeds — the Graphics
    // placeholder below is the initial and fallback surface either way.
    this.loadVehicleAssets = loadVehicleAssets;
    this.requestedVehicleAssetKey = null;
    this.assetRequestId = 0;
    this.destroyed = false;
    this.loadedVehicleArt = null;

    this.root = new Container();
    container.addChild(this.root);

    // Shadow under the kart — separate so the bob doesn't move it.
    this.shadow = new Graphics()
      .ellipse(UNIT_WIDTH / 2, UNIT_HEIGHT * 0.92, UNIT_WIDTH * 0.52, 9)
      .fill({ color: SHADOW_COLOR, alpha: 0.25 });

    this.kart = new Graphics();
    this.drawKart(this.kart);

    this.root.addChild(this.shadow, this.kart);
  }

  drawKart(g) {
    // Rear wheels (big, like the over-the-shoulder reference art).
    g.roundRect(-6, UNIT_HEIGHT * 0.45, 22, UNIT_HEIGHT * 0.5, 7).fill(
      WHEEL_COLOR,
    );
    g.roundRect(
      UNIT_WIDTH - 16,
      UNIT_HEIGHT * 0.45,
      22,
      UNIT_HEIGHT * 0.5,
      7,
    ).fill(WHEEL_COLOR);

    // Body.
    g.roundRect(4, UNIT_HEIGHT * 0.3, UNIT_WIDTH - 8, UNIT_HEIGHT * 0.6, 12)
      .fill(KART_BODY_COLOR);
    g.roundRect(
      UNIT_WIDTH * 0.3,
      UNIT_HEIGHT * 0.34,
      UNIT_WIDTH * 0.4,
      UNIT_HEIGHT * 0.18,
      6,
    ).fill(KART_STRIPE_COLOR);

    // Driver helmet dome peeking above the body.
    g.ellipse(UNIT_WIDTH / 2, UNIT_HEIGHT * 0.22, UNIT_WIDTH * 0.16, 14).fill(
      HELMET_COLOR,
    );
  }

  resize() {
    // Placement derives from frameState width/height on the next update.
  }

  // Called from the renderer's runtime-update boundary only, never per frame.
  setVehicleAssetKey(nextKey) {
    if (typeof nextKey !== "string" || nextKey === "") {
      return;
    }
    if (nextKey === this.requestedVehicleAssetKey) {
      return;
    }

    this.requestedVehicleAssetKey = nextKey;
    this.requestVehicleArt(nextKey);
  }

  async requestVehicleArt(vehicleAssetKey) {
    const requestId = ++this.assetRequestId;
    const result = await this.loadVehicleAssets(vehicleAssetKey);

    // A stale result must never replace a newer requested key, and a late
    // result must never mutate a destroyed layer.
    if (this.destroyed || requestId !== this.assetRequestId) {
      return;
    }

    // Prepared only (C1-06C-PREP): the first texture is the future static
    // art; Sprite creation and anchor/scale land with the real GREEN MASTER.
    this.loadedVehicleArt =
      result.status === VEHICLE_ASSET_STATUS.LOADED
        ? { texture: result.textures[0], definition: result.definition }
        : null;
  }

  update(frameState) {
    const { visualSpeed, deltaMs, layout } = frameState;
    this.elapsedMs += deltaMs;

    const kartWidth = layout.playerKart.maxWidth;
    const scale = kartWidth / UNIT_WIDTH;
    this.root.scale.set(scale);
    this.root.x = layout.playerKart.anchorX - kartWidth / 2;
    this.root.y = layout.playerKart.anchorY - (UNIT_HEIGHT * scale) / 2;

    // Cosmetic speed bob — visual only, never real movement.
    const bobStrength = Math.min(1, Math.abs(visualSpeed) / 2);
    this.kart.y =
      Math.sin(this.elapsedMs / BOB_FREQUENCY_MS) * BOB_MAX_PX * bobStrength;
    this.kart.rotation =
      Math.sin(this.elapsedMs / (BOB_FREQUENCY_MS * 2.6)) *
      0.012 *
      bobStrength;
  }

  destroy() {
    this.destroyed = true;
    this.root.destroy({ children: true });
  }
}
