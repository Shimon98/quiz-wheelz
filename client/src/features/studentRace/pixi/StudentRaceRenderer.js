import { Container, Graphics } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { STUDENT_RACE_WORLD_ART } from "../config/worldArtConfig";
import { resolveStudentRaceLayoutMetrics } from "../utils/resolveStudentRaceLayoutMetrics";
import { createRacePerspective } from "./utils/createRacePerspective";
import { createStudentRaceMotion } from "./utils/studentRaceMotion";
import { JungleLayer } from "./layers/JungleLayer";
import { MidBaseLayer } from "./layers/MidBaseLayer";
import { RoadLayer } from "./layers/RoadLayer";
import { FinishLineLayer } from "./layers/FinishLineLayer";
import { SceneryLayer } from "./layers/SceneryLayer";
import { PlayerKartLayer } from "./layers/PlayerKartLayer";
import { EffectsLayer } from "./layers/EffectsLayer";
import { OpponentLayer } from "./layers/OpponentLayer.js";
import { resolveRaceObjectGeometry } from "./utils/resolveRaceObjectGeometry.js";

export class StudentRaceRenderer {
  constructor(app) {
    this.app = app;
    this.runtimeState = null;
    this.width = app.screen.width;
    this.height = app.screen.height;
    this.motion = createStudentRaceMotion();
    this.destroyed = false;
    this.worldReady = false;

    this.loadingSurface = new Graphics();
    this.backgroundContainer = new Container();
    this.worldContainer = new Container();
    this.playerContainer = new Container();
    this.effectsContainer = new Container();
    this.sceneContainers = [
      this.backgroundContainer,
      this.worldContainer,
      this.playerContainer,
      this.effectsContainer,
    ];
    this.sceneContainers.forEach((container) => { container.visible = false; });
    app.stage.addChild(this.loadingSurface, ...this.sceneContainers);
    this.drawLoadingSurface();

    const { camera, road, viewDepthZones } = STUDENT_RACE_VISUAL_CONFIG;
    this.camera = camera;
    this.layout = resolveStudentRaceLayoutMetrics({
      width: this.width,
      height: this.height,
    });
    this.perspective = this.buildPerspective();
    this.raceObjectGeometry = resolveRaceObjectGeometry(this.layout, this.perspective);

    this.jungleLayer = new JungleLayer(this.backgroundContainer);
    this.midBaseLayer = new MidBaseLayer(this.worldContainer);
    this.roadLayer = new RoadLayer(this.worldContainer, { road, viewDepthZones });
    this.finishLineLayer = new FinishLineLayer(this.worldContainer);
    this.sceneryLayer = new SceneryLayer(this.worldContainer);
    this.opponentLayer = new OpponentLayer(this.worldContainer);
    this.playerKartLayer = new PlayerKartLayer(this.playerContainer);
    this.effectsLayer = new EffectsLayer(this.effectsContainer);
    this.layers = [
      this.jungleLayer,
      this.midBaseLayer,
      this.roadLayer,
      this.finishLineLayer,
      this.sceneryLayer,
      this.opponentLayer,
      this.playerKartLayer,
      this.effectsLayer,
    ];
    this.ready = Promise.allSettled(this.layers.map((layer) => layer.ready)).then(() => {
      if (!this.destroyed) this.worldReady = true;
    });

    this.tick = this.tick.bind(this);
    app.ticker.add(this.tick);
  }

  buildPerspective() {
    return createRacePerspective({
      width: this.width,
      worldBottomY: this.layout.world.bottomY,
      widthUnit: this.layout.world.widthUnit,
      camera: this.camera,
      viewDistanceAhead: STUDENT_RACE_ANIMATION_CONFIG.projection.viewDistanceAhead,
    });
  }

  drawLoadingSurface() {
    this.loadingSurface.clear()
      .rect(0, 0, this.width, this.height)
      .fill(STUDENT_RACE_WORLD_ART.sky.topColor);
  }

  updateRuntimeState(nextState) {
    this.runtimeState = nextState;
    this.playerKartLayer.setVehicleAssetKey(nextState?.player?.vehicleAssetKey);
    this.motion.updateRuntimeState(nextState);
    this.opponentLayer.applyRuntimeState(nextState);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.layout = resolveStudentRaceLayoutMetrics({ width, height });
    this.perspective = this.buildPerspective();
    this.raceObjectGeometry = resolveRaceObjectGeometry(this.layout, this.perspective);
    if (!this.worldReady) this.drawLoadingSurface();
    this.layers.forEach((layer) => layer.resize(width, height));
  }

  tick(ticker) {
    const { position, speed } = this.motion.advance(ticker.elapsedMS ?? ticker.deltaMS);
    if (!this.worldReady) return;

    const frameState = {
      ...this.raceObjectGeometry,
      raceObjectCameraPosition: position - this.raceObjectGeometry.playerReferenceDistance,
      deltaMs: ticker.deltaMS,
      width: this.width,
      height: this.height,
      visualPosition: position,
      visualSpeed: speed,
      cameraPosition: position,
      worldOffset: position * STUDENT_RACE_ANIMATION_CONFIG.serverUnits.positionToPixelsRatio,
      perspective: this.perspective,
      layout: this.layout,
      runtimeState: this.runtimeState,
    };
    this.layers.forEach((layer) => layer.update(frameState));
    if (this.loadingSurface.visible) {
      this.sceneContainers.forEach((container) => { container.visible = true; });
      this.loadingSurface.visible = false;
    }
  }

  destroy() {
    this.destroyed = true;
    this.app.ticker.remove(this.tick);
    this.layers.forEach((layer) => layer.destroy());
    this.app.stage.removeChildren();
    this.loadingSurface.destroy();
    this.backgroundContainer.destroy({ children: true });
    this.worldContainer.destroy({ children: true });
    this.playerContainer.destroy({ children: true });
    this.effectsContainer.destroy({ children: true });
  }
}
