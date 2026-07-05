import { Container, Graphics } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";

/*
 * The student race renderer — owns EVERYTHING frame-by-frame. The
 * frame-interpolated values (visualPosition, visualSpeed, cameraPosition)
 * live here and are NEVER pushed back into React state; React only hands in
 * targets via updateRuntimeState (see the feature README).
 *
 * D scope: container skeleton, ticker loop, interpolation toward the
 * contract's targets (factors from raceAnimationConfig — layers never invent
 * numbers), and a small debug marker proving the loop runs. The world
 * (road/jungle/kart layers) lands in UI-10F inside worldContainer.
 *
 * The renderer never computes score/correctness/progress/finish — the server
 * decides; this class only draws.
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

    this.backgroundContainer = new Container();
    this.worldContainer = new Container();
    this.effectsContainer = new Container();
    this.debugContainer = new Container();
    app.stage.addChild(
      this.backgroundContainer,
      this.worldContainer,
      this.effectsContainer,
      this.debugContainer,
    );

    // D-only debug marker: slides with visualPosition so the interpolation
    // is visibly alive before any world layer exists. Removed in UI-10F.
    this.debugMarker = new Graphics().roundRect(0, 0, 48, 24, 6).fill(0x2f9e44);
    this.debugContainer.addChild(this.debugMarker);
    this.positionDebugMarker();

    this.tick = this.tick.bind(this);
    app.ticker.add(this.tick);
  }

  updateRuntimeState(nextState) {
    this.runtimeState = nextState;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.positionDebugMarker();
  }

  positionDebugMarker() {
    this.debugMarker.y = this.height * 0.5 - 12;
  }

  tick(ticker) {
    const { interpolation, serverUnits } = STUDENT_RACE_ANIMATION_CONFIG;
    const targets = this.runtimeState?.visual;
    if (!targets) return;

    // Frame-rate-independent-ish easing: the config factors are tuned for a
    // 60fps frame, scaled by deltaTime (≈1 at 60fps) and clamped.
    const dt = ticker.deltaTime;
    const positionBlend = Math.min(
      1,
      interpolation.targetPositionLerpFactor * dt,
    );
    const speedBlend = Math.min(1, interpolation.targetSpeedLerpFactor * dt);

    this.visualPosition +=
      (targets.targetPosition - this.visualPosition) * positionBlend;
    this.visualSpeed += (targets.targetSpeed - this.visualSpeed) * speedBlend;
    this.cameraPosition = this.visualPosition;

    // Debug marker x = interpolated world position in pixels, wrapped so it
    // keeps crossing the frame during long dev runs.
    const worldX = this.visualPosition * serverUnits.positionToPixelsRatio;
    this.debugMarker.x = this.width > 0 ? worldX % this.width : 0;
  }

  destroy() {
    this.app.ticker.remove(this.tick);
    this.app.stage.removeChildren();
    this.backgroundContainer.destroy({ children: true });
    this.worldContainer.destroy({ children: true });
    this.effectsContainer.destroy({ children: true });
    this.debugContainer.destroy({ children: true });
  }
}
