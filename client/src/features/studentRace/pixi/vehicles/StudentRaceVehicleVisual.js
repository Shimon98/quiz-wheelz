import { Container, Graphics, Sprite } from "pixi.js";

import {
  loadStudentRaceVehicleAssets,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";

import { VEHICLE_UNIT_WIDTH as UNIT_WIDTH, VEHICLE_UNIT_HEIGHT as UNIT_HEIGHT,
  VEHICLE_GROUND_Y as GROUND_Y } from "./studentRaceVehicleGeometry.js";

const KART_BODY_COLOR = 0x37b24d;
const KART_STRIPE_COLOR = 0x2b8a3e;
const WHEEL_COLOR = 0x212529;
const HELMET_COLOR = 0x339af0;
const SHADOW_COLOR = 0x1d3557;
const BOB_FREQUENCY_MS = 95;
const BOB_MAX_PX = 2.5;
const ART_REVEAL_MS = 120;

export class StudentRaceVehicleVisual {
  constructor(container, { loadVehicleAssets = loadStudentRaceVehicleAssets } = {}) {
    this.elapsedMs = 0;
    this.loadVehicleAssets = loadVehicleAssets;
    this.requestedVehicleAssetKey = null;
    this.assetRequestId = 0;
    this.destroyed = false;
    this.artSprite = null;
    this.artRevealMs = 0;

    this.root = new Container();
    this.root.pivot.set(UNIT_WIDTH / 2, GROUND_Y);
    container.addChild(this.root);

    this.shadow = new Graphics()
      .ellipse(UNIT_WIDTH / 2, GROUND_Y, UNIT_WIDTH * 0.52, 9)
      .fill({ color: SHADOW_COLOR, alpha: 0.25 });
    this.shadow.visible = false;

    this.kart = new Container();
    this.placeholder = new Graphics();
    this.drawPlaceholder(this.placeholder);
    this.placeholder.visible = false;
    this.kart.addChild(this.placeholder);

    this.root.addChild(this.shadow, this.kart);
  }

  drawPlaceholder(g) {
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
    g.roundRect(4, UNIT_HEIGHT * 0.3, UNIT_WIDTH - 8, UNIT_HEIGHT * 0.6, 12)
      .fill(KART_BODY_COLOR);
    g.roundRect(
      UNIT_WIDTH * 0.3,
      UNIT_HEIGHT * 0.34,
      UNIT_WIDTH * 0.4,
      UNIT_HEIGHT * 0.18,
      6,
    ).fill(KART_STRIPE_COLOR);
    g.ellipse(UNIT_WIDTH / 2, UNIT_HEIGHT * 0.22, UNIT_WIDTH * 0.16, 14).fill(
      HELMET_COLOR,
    );
  }

  resize() {}

  setVehicleAssetKey(nextKey) {
    if (typeof nextKey !== "string" || nextKey === "") {
      return;
    }
    if (nextKey === this.requestedVehicleAssetKey) {
      return;
    }

    this.requestedVehicleAssetKey = nextKey;
    this.clearVehicleArt();
    this.requestVehicleArt(nextKey);
  }

  async requestVehicleArt(vehicleAssetKey) {
    const requestId = ++this.assetRequestId;
    const result = await this.loadVehicleAssets(vehicleAssetKey);

    if (this.destroyed || requestId !== this.assetRequestId) {
      return;
    }

    this.showVehicleArt(
      result.status === VEHICLE_ASSET_STATUS.LOADED ? result : null,
    );
  }

  clearVehicleArt() {
    this.artSprite?.destroy();
    this.artSprite = null;
    this.placeholder.visible = false;
    this.shadow.visible = false;
  }

  showVehicleArt(loadedResult) {
    this.clearVehicleArt();
    this.shadow.visible = true;

    if (loadedResult == null) {
      this.placeholder.visible = true;
      return;
    }

    this.artSprite = this.createArtSprite(
      loadedResult.textures[0],
      loadedResult.definition,
    );
    this.artSprite.alpha = 0;
    this.artRevealMs = 0;
    this.kart.addChild(this.artSprite);
  }

  createArtSprite(texture, { anchorX, anchorY, baseScale }) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(anchorX, anchorY);
    sprite.scale.set((UNIT_WIDTH * baseScale) / texture.width);
    sprite.position.set(UNIT_WIDTH / 2, GROUND_Y);
    return sprite;
  }

  setGroundTransform({ x, y, width, alpha = 1, zIndex = 0 }) {
    this.root.position.set(x, y);
    this.root.scale.set(width / UNIT_WIDTH);
    this.root.alpha = alpha;
    this.root.zIndex = zIndex;
  }

  updateIdle({ deltaMs, movementStrength, reducedMotion }) {
    this.elapsedMs += deltaMs;
    if (this.artSprite != null && this.artSprite.alpha < 1) {
      this.artRevealMs += deltaMs;
      this.artSprite.alpha = reducedMotion ? 1 : Math.min(1, this.artRevealMs / ART_REVEAL_MS);
    }
    const bobStrength = reducedMotion ? 0 : Math.min(1, Math.abs(movementStrength));
    this.kart.y = Math.sin(this.elapsedMs / BOB_FREQUENCY_MS) * BOB_MAX_PX * bobStrength;
    this.kart.rotation = Math.sin(this.elapsedMs / (BOB_FREQUENCY_MS * 2.6)) * 0.012 * bobStrength;
  }

  getBounds() {
    return this.root.getBounds();
  }

  setVisible(visible) {
    this.root.visible = visible;
  }

  reset() {
    this.assetRequestId += 1;
    this.requestedVehicleAssetKey = null;
    this.elapsedMs = 0;
    this.artRevealMs = 0;
    this.kart.y = 0;
    this.kart.rotation = 0;
    this.clearVehicleArt();
    this.setVisible(false);
  }

  destroy() {
    this.destroyed = true;
    this.root.destroy({ children: true });
  }
}
