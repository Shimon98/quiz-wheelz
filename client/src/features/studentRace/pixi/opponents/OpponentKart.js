import { StudentRaceVehicleVisual } from "../vehicles/StudentRaceVehicleVisual.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";

export const OPPONENT_VISIBILITY_STATES = Object.freeze({
  HIDDEN: "HIDDEN", ENTERING: "ENTERING", VISIBLE: "VISIBLE", EXITING: "EXITING",
});

const CONFIG = STUDENT_RACE_VISUAL_CONFIG.opponents;
const STATES = OPPONENT_VISIBILITY_STATES;

export class OpponentKart {
  constructor(container, options) {
    this.vehicleVisual = new StudentRaceVehicleVisual(container, options);
    this.reset();
  }

  assignIdentity(racePlayerId) {
    this.racePlayerId = racePlayerId;
  }

  applySnapshot(opponent, snapshotAtEpochMs) {
    const checkpointAge = opponent.positionAtEpochMs == null ? 0
      : Math.max(0, snapshotAtEpochMs - opponent.positionAtEpochMs);
    const sameCheckpoint = this.positionAtEpochMs === opponent.positionAtEpochMs;
    this.baseAgeMs = sameCheckpoint
      ? Math.max(checkpointAge, this.baseAgeMs + this.elapsedSinceSnapshotMs) : checkpointAge;
    this.racePlayerId = opponent.racePlayerId;
    this.authoritativePosition = opponent.position;
    this.positionAtEpochMs = opponent.positionAtEpochMs;
    this.snapshotAtEpochMs = snapshotAtEpochMs;
    this.movementUnitsPerSecond = opponent.movementUnitsPerSecond;
    this.laneNumber = opponent.laneNumber;
    this.status = opponent.status;
    this.finishedAtEpochMs = opponent.finishedAtEpochMs;
    this.removed = false;
    this.releasable = false;
    this.elapsedSinceSnapshotMs = 0;
    if (this.visualPosition == null) this.visualPosition = opponent.position;
    this.vehicleVisual.setVehicleAssetKey(opponent.vehicleAssetKey);
  }

  beginAuthoritativeRemoval() {
    this.removed = true;
    this.beginExit();
  }

  beginExit() {
    if (this.visibilityState === STATES.HIDDEN) this.releasable = true;
    else this.visibilityState = STATES.EXITING;
  }

  advancePosition(deltaMs, totalDistance) {
    this.elapsedSinceSnapshotMs += deltaMs;
    const ageMs = Math.min(CONFIG.maxPredictionMs, this.baseAgeMs + this.elapsedSinceSnapshotMs);
    const rate = this.status === "RACING" && this.positionAtEpochMs != null ? this.movementUnitsPerSecond : 0;
    this.targetPosition = Math.max(0, Math.min(totalDistance, this.authoritativePosition + rate * ageMs / 1000));
    const difference = this.targetPosition - this.visualPosition;
    if (Math.abs(difference) >= CONFIG.snapCorrectionUnits) this.visualPosition = this.targetPosition;
    else this.visualPosition += difference * (1 - Math.exp(-deltaMs / CONFIG.smoothingTimeMs));
  }

  advanceVisibility(deltaMs, reducedMotion) {
    if (this.visibilityState === STATES.ENTERING) {
      this.alpha = reducedMotion ? 1 : Math.min(1, this.alpha + deltaMs / CONFIG.enterFadeMs);
      if (this.alpha === 1) this.visibilityState = STATES.VISIBLE;
    } else if (this.visibilityState === STATES.EXITING) {
      this.alpha = reducedMotion ? 0 : Math.max(0, this.alpha - deltaMs / CONFIG.exitFadeMs);
      if (this.alpha === 0) {
        this.visibilityState = STATES.HIDDEN;
        this.releasable = true;
      }
    }
  }

  update(frame) {
    if (this.racePlayerId == null || this.visualPosition == null) return;
    const { deltaMs, perspective, layout, runtimeState, width, height,
      raceObjectCameraPosition, playerRoadHalfWidth, laneStepRatio } = frame;
    this.advancePosition(Math.max(0, deltaMs), runtimeState.totalDistance);
    const relativeDistance = this.visualPosition - raceObjectCameraPosition;
    const lateralRatio = (this.laneNumber - runtimeState.player.laneNumber) * laneStepRatio;
    const maxDepth = perspective.depthAtY(height + layout.playerKart.maxWidth);
    const projected = perspective.projectTrackObject(relativeDistance, lateralRatio, { maxDepth });
    this.projected = projected;
    const reducedMotion = runtimeState.visual?.reducedMotion === true;

    if (!projected.visible) {
      if (this.visibilityState !== STATES.HIDDEN) this.beginExit();
      this.advanceVisibility(deltaMs, reducedMotion);
      this.vehicleVisual.setVisible(false);
      return;
    }

    const targetWidth = layout.playerKart.maxWidth * projected.roadHalfWidth / playerRoadHalfWidth;
    this.vehicleVisual.setGroundTransform({ x: projected.x, y: projected.y,
      width: targetWidth, alpha: this.alpha, zIndex: projected.depth });
    this.vehicleVisual.setVisible(true);
    const bounds = this.vehicleVisual.getBounds();
    const intersects = bounds.maxX >= -CONFIG.sideCullMarginPx &&
      bounds.minX <= width + CONFIG.sideCullMarginPx && bounds.minY <= height + CONFIG.sideCullMarginPx;
    const canEnter = !this.removed && intersects && relativeDistance >= 0 &&
      relativeDistance <= perspective.viewDistanceAhead - CONFIG.frontEnterMarginUnits;

    if (this.visibilityState === STATES.HIDDEN && canEnter) {
      this.visibilityState = STATES.ENTERING;
    } else if (this.visibilityState !== STATES.HIDDEN) {
      if (this.removed || !intersects ||
          relativeDistance > perspective.viewDistanceAhead - CONFIG.frontExitMarginUnits) this.beginExit();
      else if (this.visibilityState === STATES.EXITING && canEnter) this.visibilityState = STATES.ENTERING;
    }
    this.advanceVisibility(deltaMs, reducedMotion);
    this.vehicleVisual.root.alpha = this.alpha;
    this.vehicleVisual.setVisible(this.visibilityState !== STATES.HIDDEN);
    this.vehicleVisual.updateIdle({ deltaMs, reducedMotion,
      movementStrength: this.status === "RACING" ? this.movementUnitsPerSecond : 0 });
  }

  reset() {
    this.racePlayerId = null;
    this.authoritativePosition = 0;
    this.positionAtEpochMs = null;
    this.snapshotAtEpochMs = null;
    this.movementUnitsPerSecond = 0;
    this.visualPosition = null;
    this.targetPosition = 0;
    this.laneNumber = null;
    this.status = null;
    this.finishedAtEpochMs = null;
    this.baseAgeMs = 0;
    this.elapsedSinceSnapshotMs = 0;
    this.visibilityState = STATES.HIDDEN;
    this.alpha = 0;
    this.removed = false;
    this.releasable = false;
    this.projected = null;
    this.vehicleVisual.reset();
  }

  destroy() {
    this.vehicleVisual.destroy();
  }
}
