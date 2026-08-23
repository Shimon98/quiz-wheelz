import { Container } from "pixi.js";

import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig";
import { STUDENT_RACE_VISUAL_CONFIG } from "../config/raceVisualConfig";
import { resolveStudentRaceLayoutMetrics } from "../utils/resolveStudentRaceLayoutMetrics";
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
    // Prediction target (C1-03M): the server advances position continuously
    // with time and snapshots arrive every ~2s, so between snapshots the
    // renderer PREDICTS the target forward using the server-owned movement
    // rate, and every new authoritative snapshot re-bases the prediction.
    // Drawing-only — gameplay truth (finish, status) stays with the server.
    this.predictedTargetPosition = 0;
    this.lastAuthoritativeSnapshotKey = null;

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

    const { camera, road, viewDepthZones } = STUDENT_RACE_VISUAL_CONFIG;
    this.camera = camera;
    // Layout contract (G): panel/visible-world/kart metrics — the whole
    // perspective is composed against layout.world, not the raw screen.
    this.layout = resolveStudentRaceLayoutMetrics({
      width: this.width,
      height: this.height,
    });
    this.perspective = this.buildPerspective();

    this.jungleLayer = new JungleLayer(this.backgroundContainer);
    this.roadLayer = new RoadLayer(this.worldContainer, {
      road,
      viewDepthZones,
    });
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
    // Composed against the VISIBLE world area above the question panel
    // (layout contract, G): depth 1 lands at the panel's overlap line, so
    // the near zone, curb fade and kart all stay in view.
    const worldBottomY = this.layout.world.bottomY;
    const horizonY = worldBottomY * this.camera.horizonYRatio;
    const centerX = this.width * this.camera.vanishingPointXRatio;
    const topHalf = (this.width * this.camera.roadTopWidthRatio) / 2;
    const bottomHalf = (this.width * this.camera.roadBottomWidthRatio) / 2;
    const depthHeight = worldBottomY - horizonY;
    const { viewDistanceAhead } = STUDENT_RACE_ANIMATION_CONFIG.projection;

    const depthToY = (t) => horizonY + depthHeight * t * t;
    const roadHalfWidthAt = (t) => topHalf + (bottomHalf - topHalf) * t * t;

    return {
      horizonY,
      centerX,
      viewDistanceAhead,
      depthToY,
      roadHalfWidthAt,

      /*
       * THE unified track projection (F-1, track model): every on-track
       * object — the finish line today, opponents/props in the future —
       * maps its distance ahead of the player to screen space through this
       * ONE function, never through its own math. Future extension (master
       * plan, Track Model section): a laneDelta argument adding the lateral
       * offset of server lanes inside the road width.
       */
      projectTrackObject: (relativeDistance) => {
        if (relativeDistance < 0 || relativeDistance > viewDistanceAhead) {
          return { visible: false, depth: 0, y: 0, roadHalfWidth: 0 };
        }

        const depth = 1 - relativeDistance / viewDistanceAhead;
        return {
          visible: true,
          depth,
          y: depthToY(depth),
          roadHalfWidth: roadHalfWidthAt(depth),
        };
      },
    };
  }

  updateRuntimeState(nextState) {
    this.runtimeState = nextState;

    // Vehicle art selection happens at this runtime-update boundary, never
    // in tick() — the layer dedups repeated keys itself.
    this.playerKartLayer.setVehicleAssetKey(nextState?.player?.vehicleAssetKey);

    // A NEW authoritative snapshot re-bases the prediction (an answer bonus
    // jumps it forward; a fresh poll corrects small prediction drift — the
    // lerp below absorbs the correction smoothly, no visual snap). Identity
    // is the snapshot timestamp — a fresh snapshot may change speed/rate
    // while position stays equal; the dev local runtime has no snapshot
    // clock, so it falls back to position identity.
    const snapshotKey =
      nextState?.lastSnapshotAtEpochMs ??
      nextState?.visual?.targetPosition ??
      0;
    if (snapshotKey !== this.lastAuthoritativeSnapshotKey) {
      this.lastAuthoritativeSnapshotKey = snapshotKey;
      this.predictedTargetPosition = nextState?.visual?.targetPosition ?? 0;
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.layout = resolveStudentRaceLayoutMetrics({ width, height });
    this.perspective = this.buildPerspective();
    this.layers.forEach((layer) => layer.resize(width, height));
  }

  tick(ticker) {
    const { interpolation, serverUnits } = STUDENT_RACE_ANIMATION_CONFIG;
    const targets = this.runtimeState?.visual;
    const targetSpeed = targets?.targetSpeed ?? 0;
    // Server-owned effective movement rate (speed x base rate). Predict the
    // target forward between snapshots — the world flows the whole time the
    // server says the player is moving, and stops with the FINISHED rate of
    // 0. No status checks here. (The dev local runtime has rate 0 and moves
    // via its own frequent authoritative updates — same behavior as before.)
    const movementRate = targets?.movementUnitsPerSecond ?? 0;
    this.predictedTargetPosition += movementRate * (ticker.deltaMS / 1000);

    // Prediction never visually crosses the authoritative finish line — the
    // FINISHED transition belongs to the server snapshot alone.
    const totalDistance = this.runtimeState?.totalDistance;
    if (
      totalDistance != null &&
      this.predictedTargetPosition > totalDistance
    ) {
      this.predictedTargetPosition = totalDistance;
    }

    // Wrap guard (dev local runtime rolls back to 0 at the track end): a
    // backward jump larger than half the track is a wrap, not movement —
    // snap instead of lerping the whole world backwards.
    if (
      totalDistance != null &&
      this.predictedTargetPosition - this.visualPosition < -totalDistance / 2
    ) {
      this.visualPosition = this.predictedTargetPosition;
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
      (this.predictedTargetPosition - this.visualPosition) * positionBlend;
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
      // Decorative repeating-scenery scroll (Road/Jungle only) — a single
      // motion source: the smoothed predicted position. The old separate
      // cosmetic travel term is gone (C1-03M) — position itself now flows
      // continuously, so a second term would count movement twice.
      worldOffset: this.cameraPosition * serverUnits.positionToPixelsRatio,
      perspective: this.perspective,
      layout: this.layout,
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
