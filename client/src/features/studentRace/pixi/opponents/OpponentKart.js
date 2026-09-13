import { StudentRaceVehicleVisual } from "../vehicles/StudentRaceVehicleVisual.js";
import { STUDENT_RACE_VISUAL_CONFIG } from "../../config/raceVisualConfig.js";
import { advanceFinishRunout } from "../utils/advanceFinishRunout.js";
import { RACE_PLAYER_STATUSES } from "../../../../constants/raceStatusConstants.js";
import { createRaceVisualMotionTracker, normalizeMotionAuthority } from "../utils/createRaceVisualMotionTracker.js";
import { resolveLaneOffsetRatio } from "../utils/resolveRaceObjectGeometry.js";

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

  applySnapshot(opponent, snapshotAtEpochMs, totalDistance = Infinity) {
    this.racePlayerId = opponent.racePlayerId;
    this.authoritativePosition = opponent.position;
    this.positionAtEpochMs = opponent.positionAtEpochMs;
    this.snapshotAtEpochMs = snapshotAtEpochMs;
    this.movementUnitsPerSecond = opponent.movementUnitsPerSecond;
    this.laneNumber = opponent.laneNumber;
    this.status = opponent.status;
    this.observedRacing ||= opponent.status === RACE_PLAYER_STATUSES.RACING;
    this.finishedAtEpochMs = opponent.finishedAtEpochMs;
    this.removed = false;
    this.releasable = false;
    const authority = normalizeMotionAuthority({
      position: opponent.position,
      positionAtEpochMs: opponent.positionAtEpochMs,
      movementRate: opponent.movementUnitsPerSecond,
      canPredict: opponent.status === RACE_PLAYER_STATUSES.RACING,
    }, snapshotAtEpochMs);
    if (this.visualPosition == null) {
      this.motion.seed(authority, Number.isFinite(totalDistance) ? totalDistance : Infinity);
      this.visualPosition = this.motion.position();
    }
    this.motion.updateAuthority(authority);
    this.targetPosition = this.motion.targetPosition();
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

  advancePosition(deltaMs, totalDistance, finishPresentation, frame = null) {
    const released = this.observedRacing && finishPresentation?.active &&
      finishPresentation.releasedFinisherIdsSet.has(this.racePlayerId);
    if (released && !this.finishReleased) {
      this.finishReleased = true;
      this.finishRunout = { start: this.visualPosition, finishLine: totalDistance,
        target: totalDistance + finishPresentation.runoutUnits, elapsedMs: 0,
        durationMs: finishPresentation.runoutDurationMs };
    }
    if (this.finishRunout) {
      this.visualPosition = advanceFinishRunout(this.finishRunout,
        frame?.runtimeState.visual?.reducedMotion ? this.finishRunout.durationMs : deltaMs);
      this.targetPosition = this.finishRunout.target;
      return;
    }
    const limit = Math.max(0, totalDistance - (finishPresentation?.active ? finishPresentation.visualHoldUnits : 0));
    this.visualPosition = this.motion.advance(deltaMs, { maxPosition: limit,
      slowdownDistance: finishPresentation?.active ? finishPresentation.slowdownDistanceUnits : null }).position;
    this.targetPosition = Math.min(limit, this.motion.targetPosition());
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

  prepareFrame(frame) {
    this.canEnter = false;
    this.drawIntersects = false;
    this.preloaded = false;
    if (this.racePlayerId == null || this.visualPosition == null) return;
    const { deltaMs, perspective, layout, runtimeState, width,
      raceObjectCameraPosition, playerRoadHalfWidth, laneStepRatio, laneLimitAt } = frame;
    this.advancePosition(Math.max(0, frame.elapsedMs ?? deltaMs), runtimeState.totalDistance, frame.finishPresentation, frame);
    if (this.status === RACE_PLAYER_STATUSES.FINISHED && !this.observedRacing) {
      this.vehicleVisual.setVisible(false);
      this.projected = null;
      return;
    }
    const relativeDistance = this.visualPosition - raceObjectCameraPosition;
    const laneDelta = this.laneNumber - runtimeState.player.laneNumber;
    this.laneOffsetMagnitude = Math.abs(laneDelta) * laneStepRatio;
    this.relativeDistance = relativeDistance;
    const base = perspective.projectTrackObject(relativeDistance, 0, { maxDepth: Infinity });
    if (!base.visible) {
      this.projected = base;
      return;
    }
    const lateralRatio = resolveLaneOffsetRatio(laneDelta, laneStepRatio, laneLimitAt(base.depth));
    const projected = { ...base, x: base.x + base.roadHalfWidth * lateralRatio };
    this.projected = projected;

    const targetWidth = layout.playerKart.maxWidth * projected.roadHalfWidth / playerRoadHalfWidth;
    this.vehicleVisual.setGroundTransform({ x: projected.x, y: projected.y,
      width: targetWidth, alpha: this.alpha, zIndex: projected.depth, visualScale: frame.vehicleVisualScale });
    const bounds = this.vehicleVisual.getBounds();
    if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) return;
    this.preloadMarginX = bounds.maxX - bounds.minX + CONFIG.sideCullMarginPx;
    this.preloadMarginY = (bounds.maxY - bounds.minY) * CONFIG.preloadVehicleHeights;
    this.preloaded = bounds.maxX >= -this.preloadMarginX && bounds.minX <= width + this.preloadMarginX &&
      bounds.minY <= layout.questionPanel.topY + this.preloadMarginY && bounds.maxY >= -this.preloadMarginY;
    this.drawIntersects = bounds.maxX >= -CONFIG.sideCullMarginPx && bounds.minX <= width + CONFIG.sideCullMarginPx &&
      bounds.minY <= layout.questionPanel.topY + CONFIG.sideCullMarginPx && bounds.maxY >= 0;
    this.canEnter = !this.removed && this.drawIntersects &&
      relativeDistance <= perspective.viewDistanceAhead - CONFIG.frontEnterMarginUnits;
  }

  presentFrame(frame, selected) {
    const { deltaMs, perspective, runtimeState } = frame;
    const reducedMotion = runtimeState.visual?.reducedMotion === true;
    const canEnter = selected && this.canEnter;
    if (this.visibilityState === STATES.HIDDEN && canEnter) {
      this.visibilityState = STATES.ENTERING;
    } else if (this.visibilityState !== STATES.HIDDEN) {
      if (!selected || this.removed || !this.drawIntersects ||
          this.relativeDistance > perspective.viewDistanceAhead - CONFIG.frontExitMarginUnits) this.beginExit();
      else if (this.visibilityState === STATES.EXITING && canEnter) this.visibilityState = STATES.ENTERING;
    }
    this.advanceVisibility(deltaMs, reducedMotion);
    this.vehicleVisual.root.alpha = this.alpha;
    this.vehicleVisual.setVisible(this.projected?.visible === true && this.visibilityState !== STATES.HIDDEN);
    this.vehicleVisual.updateIdle({ deltaMs, reducedMotion,
      movementStrength: this.status === RACE_PLAYER_STATUSES.RACING ? this.movementUnitsPerSecond : 0 });
  }

  update(frame) {
    this.prepareFrame(frame);
    this.presentFrame(frame, true);
  }

  reset() {
    this.racePlayerId = null;
    this.authoritativePosition = 0;
    this.positionAtEpochMs = null;
    this.snapshotAtEpochMs = null;
    this.movementUnitsPerSecond = 0;
    this.visualPosition = null;
    this.motion = createRaceVisualMotionTracker();
    this.targetPosition = 0;
    this.laneNumber = null;
    this.status = null;
    this.observedRacing = false;
    this.finishedAtEpochMs = null;
    this.finishRunout = null;
    this.finishReleased = false;
    this.visibilityState = STATES.HIDDEN;
    this.alpha = 0;
    this.removed = false;
    this.releasable = false;
    this.projected = null;
    this.canEnter = false;
    this.drawIntersects = false;
    this.preloaded = false;
    this.relativeDistance = 0;
    this.laneOffsetMagnitude = 0;
    this.vehicleVisual.reset();
  }

  destroy() {
    this.vehicleVisual.destroy();
  }
}
