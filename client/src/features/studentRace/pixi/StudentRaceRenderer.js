import { Container } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { JungleLayer } from "./layers/JungleLayer";
import { RoadLayer } from "./layers/RoadLayer";
import { FinishLineLayer } from "./layers/FinishLineLayer";
import { PlayerKartLayer } from "./layers/PlayerKartLayer";
import { EffectsLayer } from "./layers/EffectsLayer";

/*
 * The student race renderer — owns EVERYTHING frame-by-frame. The
 * frame-interpolated values (visualPosition, visualSpeed, cameraPosition)
 * live here and are NEVER pushed back into React state; React only hands in
 * targets via updateRuntimeState (feature README, master plan §5.4/§6.5).
 *
 * Camera model (the binding F decision): pseudo-perspective,
 * over-the-shoulder — the kart is screen-fixed, the world flows from the
 * horizon toward the player. The perspective math is built ONCE here and
 * handed to every layer through frameState, so the horizon/road geometry
 * has a single implementation.
 *
 * The renderer never computes score/correctness/progress/finish — the
 * server decides; this class only draws.
 */
export class StudentRaceRenderer {
  constructor(app) {
    this.app = app;
    this.runtimeState = null;

    this.width = app.screen.width;
    this.height = app.screen.height;

    // Renderer-internal motion state (see header note).
    this.visualPosition = 0;
    this.visualSpeed = 0;
    this.cameraPosition = 0;

    // Stacking order: background world behind, screen-fixed kart above the
    // moving world, effects on top.
    this.backgroundContainer = new Container();
    this.worldContainer = new Container();
    this.playerContainer = new Container();
    this.effectsContainer = new Container();
    app.stage.addChild(
      this.backgroundContainer,
      this.worldContainer,
      this.playerContainer,
      this.effectsContainer,
    );

    const { camera, road } = STUDENT_RACE_VISUAL_CONFIG;
    this.camera = camera;
    this.perspective = this.buildPerspective();

    this.jungleLayer = new JungleLayer(this.backgroundContainer);
    this.roadLayer = new RoadLayer(this.worldContainer, { road });
    this.finishLineLayer = new FinishLineLayer(this.worldContainer);
    this.playerKartLayer = new PlayerKartLayer(this.playerContainer);
    this.effectsLayer = new EffectsLayer(this.effectsContainer);

    // Update order = paint dependency order.
    this.layers = [
      this.jungleLayer,
      this.roadLayer,
      this.finishLineLayer,
      this.playerKartLayer,
      this.effectsLayer,
    ];

    this.tick = this.tick.bind(this);
    app.ticker.add(this.tick);
  }

  /*
   * The ONE pseudo-perspective implementation, shared by all world layers.
   * t is depth: 0 at the horizon, 1 at the screen bottom; the quadratic
   * easing compresses steps near the horizon like real perspective.
   */
  buildPerspective() {
    const horizonY = this.height * this.camera.horizonYRatio;
    const centerX = this.width * this.camera.vanishingPointXRatio;
    const topHalf = (this.width * this.camera.roadTopWidthRatio) / 2;
    const bottomHalf = (this.width * this.camera.roadBottomWidthRatio) / 2;
    const depthHeight = this.height - horizonY;

    return {
      horizonY,
      centerX,
      depthToY: (t) => horizonY + depthHeight * t * t,
      roadHalfWidthAt: (t) => topHalf + (bottomHalf - topHalf) * t * t,
    };
  }

  updateRuntimeState(nextState) {
    this.runtimeState = nextState;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.perspective = this.buildPerspective();
    this.layers.forEach((layer) => layer.resize(width, height));
  }

  tick(ticker) {
    const { interpolation, serverUnits } = STUDENT_RACE_ANIMATION_CONFIG;
    const targets = this.runtimeState?.visual;
    const targetPosition = targets?.targetPosition ?? 0;
    const targetSpeed = targets?.targetSpeed ?? 0;

    // Wrap guard (dev local runtime rolls back to 0 at the track end): a
    // backward jump larger than half the track is a wrap, not movement —
    // snap instead of lerping the whole world backwards.
    const totalDistance = this.runtimeState?.totalDistance;
    if (
      totalDistance != null &&
      targetPosition - this.visualPosition < -totalDistance / 2
    ) {
      this.visualPosition = targetPosition;
    }

    // Frame-rate-independent-ish easing: config factors are tuned for a
    // 60fps frame, scaled by deltaTime (≈1 at 60fps) and clamped.
    const dt = ticker.deltaTime;
    const positionBlend = Math.min(
      1,
      interpolation.targetPositionLerpFactor * dt,
    );
    const speedBlend = Math.min(1, interpolation.targetSpeedLerpFactor * dt);

    this.visualPosition +=
      (targetPosition - this.visualPosition) * positionBlend;
    this.visualSpeed += (targetSpeed - this.visualSpeed) * speedBlend;
    this.cameraPosition = this.visualPosition;

    // One frameState for every layer — the uniform layer interface.
    const frameState = {
      deltaMs: ticker.deltaMS,
      width: this.width,
      height: this.height,
      visualPosition: this.visualPosition,
      visualSpeed: this.visualSpeed,
      cameraPosition: this.cameraPosition,
      worldOffset: this.cameraPosition * serverUnits.positionToPixelsRatio,
      perspective: this.perspective,
      runtimeState: this.runtimeState,
    };

    this.layers.forEach((layer) => layer.update(frameState));
  }

  destroy() {
    this.app.ticker.remove(this.tick);
    this.layers.forEach((layer) => layer.destroy());
    this.app.stage.removeChildren();
    this.backgroundContainer.destroy({ children: true });
    this.worldContainer.destroy({ children: true });
    this.playerContainer.destroy({ children: true });
    this.effectsContainer.destroy({ children: true });
  }
}
