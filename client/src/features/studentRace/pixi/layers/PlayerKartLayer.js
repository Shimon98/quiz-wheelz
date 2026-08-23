import { Container, Graphics, Sprite } from "pixi.js";

import {
  loadStudentRaceVehicleAssets,
  VEHICLE_ASSET_STATUS,
} from "../assets/studentRaceVehicleAssets";

const KART_BODY_COLOR = 0x37b24d;
const KART_STRIPE_COLOR = 0x2b8a3e;
const WHEEL_COLOR = 0x212529;
const HELMET_COLOR = 0x339af0;
const SHADOW_COLOR = 0x1d3557;
const UNIT_WIDTH = 100;
const UNIT_HEIGHT = 64;
const GROUND_Y = UNIT_HEIGHT * 0.92;
const BOB_FREQUENCY_MS = 95;
const BOB_MAX_PX = 2.5;
const ART_REVEAL_MS = 120;

export class PlayerKartLayer {
  constructor(container, { loadVehicleAssets = loadStudentRaceVehicleAssets } = {}) {
    this.elapsedMs = 0;
    this.loadVehicleAssets = loadVehicleAssets;
    this.requestedVehicleAssetKey = null;
    this.assetRequestId = 0;
    this.destroyed = false;
    this.artSprite = null;
    this.artRevealMs = 0;

    this.root = new Container();
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

  update(frameState) {
    const { visualSpeed, deltaMs, layout } = frameState;
    this.elapsedMs += deltaMs;

    if (this.artSprite != null && this.artSprite.alpha < 1) {
      this.artRevealMs += deltaMs;
      this.artSprite.alpha = Math.min(1, this.artRevealMs / ART_REVEAL_MS);
    }

    const kartWidth = layout.playerKart.maxWidth;
    const scale = kartWidth / UNIT_WIDTH;
    this.root.scale.set(scale);
    this.root.x = layout.playerKart.anchorX - kartWidth / 2;
    this.root.y = layout.playerKart.anchorY - (UNIT_HEIGHT * scale) / 2;

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
