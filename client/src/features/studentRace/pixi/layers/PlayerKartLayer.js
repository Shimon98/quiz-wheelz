import { Graphics } from "pixi.js";
import { KART_THRUSTER_PALETTES } from "../../config/kartThrusterConfig.js";
import {
  hasGuardShield,
  selectActiveLuckEffect,
  selectChallengeSlowdownSource,
} from "../../runtime/studentRaceGameplayMode.js";

import { RACE_GAMEPLAY_MODES, RACE_LUCK_EVENT_TYPES } from "../../../../constants/raceGameplayConstants.js";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig.js";
import { getRaceGameplayPresentation } from "../../config/raceGameplayPresentationConfig.js";
import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants.js";
import { KartArtCrossfade } from "../vehicles/KartArtCrossfade.js";
import { KartLuckMarks } from "../vehicles/KartLuckMarks.js";
import { KartPoseArt } from "../vehicles/KartPoseArt.js";
import { KartThrusters } from "../vehicles/KartThrusters.js";
import { StudentRaceVehicleVisual } from "../vehicles/StudentRaceVehicleVisual.js";
import {
  playerKartGroundTransform,
  VEHICLE_GROUND_Y,
  VEHICLE_UNIT_WIDTH,
} from "../vehicles/studentRaceVehicleGeometry.js";

const AURA_RINGS = Object.freeze([
  Object.freeze({ radiusScale: 1, alpha: 0.28 }),
  Object.freeze({ radiusScale: 0.76, alpha: 0.42 }),
  Object.freeze({ radiusScale: 0.52, alpha: 0.6 }),
]);
const AURA_RADIUS_X = VEHICLE_UNIT_WIDTH * 0.64;
const AURA_RADIUS_Y = 18;
const { poseFadeMs, posePreloadDelayMs } = STUDENT_RACE_ANIMATION_CONFIG.kartPoses;
const { poseHoldMs } = STUDENT_RACE_ANIMATION_CONFIG.turboSuccess;

function createAura() {
  const aura = new Graphics();
  AURA_RINGS.forEach(({ radiusScale, alpha }) => {
    aura
      .ellipse(VEHICLE_UNIT_WIDTH / 2, VEHICLE_GROUND_Y, AURA_RADIUS_X * radiusScale, AURA_RADIUS_Y * radiusScale)
      .fill({ color: 0xffffff, alpha });
  });
  aura.blendMode = "add";
  aura.visible = false;
  aura.alpha = 0;
  return aura;
}

export class PlayerKartLayer extends StudentRaceVehicleVisual {
  constructor(container, options = {}) {
    super(container, options);
    this.aura = createAura();
    this.auraPeakAlpha = 0;
    this.root.addChildAt(this.aura, this.root.getChildIndex(this.kart));
    this.luckMarks = new KartLuckMarks(this.root, this.kart);
    this.thrusters = new KartThrusters(this.kart);
    this.pose = new KartPoseArt({
      ...(options.loadPoseTexture ? { loadTexture: options.loadPoseTexture } : {}),
      prepareTexture: options.prepareTexture ?? null,
    });
    this.fade = new KartArtCrossfade(poseFadeMs);
    this.poseOverlay = null;
    this.poseHold = null;
    this.preloadTimer = null;
    this.loadFlameTexture = options.loadFlameTexture;
    this.prepareTexture = options.prepareTexture;
  }

  // Thrusters sit on the art's own nozzles, above the sprite and inside the bobbing kart.
  showVehicleArt(loadedResult) {
    super.showVehicleArt(loadedResult);
    if (loadedResult == null) return;
    this.thrusters.place(loadedResult.definition, loadedResult.textures[0]);
    this.thrusters.loadArt(this.loadFlameTexture, this.prepareTexture);
    this.poseOverlay = this.createArtSprite(loadedResult.textures[0], loadedResult.definition);
    this.kart.addChildAt(this.poseOverlay, this.kart.getChildIndex(this.artSprite) + 1);
    this.kart.addChild(this.thrusters.container);
    // The shield bubble and the wind stay in front of the art and its fire.
    this.kart.addChild(this.luckMarks.front);
    this.pose.attach(loadedResult.definition, loadedResult.textures[0]);
    this.fade.attach(this.artSprite, this.poseOverlay);
    this.preloadTimer = setTimeout(() => {
      this.pose.preload();
      this.fade.prewarm();
    }, posePreloadDelayMs);
  }

  clearVehicleArt() {
    super.clearVehicleArt();
    this.thrusters?.clear();
    this.pose?.detach();
    this.fade?.detach();
    clearTimeout(this.preloadTimer);
    this.poseOverlay?.destroy();
    this.poseOverlay = null;
    this.poseHold = null;
  }

  playMoments(batch) {
    batch.moments.forEach(({ type }) => {
      this.thrusters.play(type);
      if (type === STUDENT_RACE_EFFECT.TURBO_SUCCESS) {
        this.poseHold = { mode: RACE_GAMEPLAY_MODES.TURBO_TRIAL, remainingMs: poseHoldMs };
      } else if (type === STUDENT_RACE_EFFECT.FINISH || type === STUDENT_RACE_EFFECT.TURBO_FAILURE) {
        this.poseHold = null;
      }
    });
  }

  // TURBO_TRIAL is an unanswered challenge. Only an accepted success moment earns the launch pose.
  presentedMode(serverMode, deltaMs, reducedMotion) {
    const restingMode = serverMode === RACE_GAMEPLAY_MODES.TURBO_TRIAL ? RACE_GAMEPLAY_MODES.NORMAL : serverMode;
    const hold = this.poseHold;
    if (hold == null) return restingMode;
    if (reducedMotion || hold.remainingMs <= 0
      || (serverMode !== RACE_GAMEPLAY_MODES.NORMAL && serverMode !== hold.mode)) {
      this.poseHold = null;
      return restingMode;
    }
    hold.remainingMs -= deltaMs;
    return hold.mode;
  }

  update({ visualSpeed, deltaMs, layout, runtimeState, playerDepth = 1, vehicleVisualScale, clientNowEpochMs }) {
    const reducedMotion = runtimeState?.visual?.reducedMotion === true;
    this.setGroundTransform({ ...playerKartGroundTransform(layout), zIndex: playerDepth, visualScale: vehicleVisualScale });
    this.updateIdle({
      deltaMs,
      movementStrength: Math.abs(visualSpeed) / 2,
      reducedMotion,
    });
    const serverMode = runtimeState?.gameplay?.mode;
    if (runtimeState?.playerFinished) this.poseHold = null;
    const mode = this.presentedMode(runtimeState?.playerFinished ? RACE_GAMEPLAY_MODES.NORMAL : serverMode, deltaMs, reducedMotion);
    this.updatePose(mode, deltaMs, reducedMotion);
    if (runtimeState?.playerFinished || mode === RACE_GAMEPLAY_MODES.CHALLENGE_CHOICE
      || (this.thrusters.oneShot?.type === STUDENT_RACE_EFFECT.TURBO_SUCCESS && mode !== RACE_GAMEPLAY_MODES.TURBO_TRIAL)) {
      this.thrusters.stopOneShot();
    }
    const presentation = getRaceGameplayPresentation(runtimeState?.playerFinished ? null : serverMode);
    this.updateAura(presentation?.kartAura ?? null, reducedMotion, deltaMs);
    const gameplay = runtimeState?.playerFinished ? null : runtimeState?.gameplay;
    const luckEffect = selectActiveLuckEffect(gameplay, clientNowEpochMs);
    this.luckMarks.update({ shield: hasGuardShield(gameplay), luckEffect, deltaMs, reducedMotion });
    const slowing = selectChallengeSlowdownSource(gameplay) != null || luckEffect === RACE_LUCK_EVENT_TYPES.MUD_SPLASH;
    this.thrusters.update({ deltaMs, palette: slowing ? KART_THRUSTER_PALETTES.slowing : presentation?.kartThrusters ?? null, reducedMotion });
  }

  updatePose(mode, deltaMs, reducedMotion) {
    if (this.artSprite == null) return;
    const turboTexture = this.pose.textures.get(this.pose.definition?.poses?.TURBO_TRIAL);
    const returning = mode !== RACE_GAMEPLAY_MODES.TURBO_TRIAL && turboTexture != null
      && (this.fade.target === turboTexture || this.artSprite.texture === turboTexture);
    this.fade.show(this.pose.textureFor(mode), { deltaMs, instant: reducedMotion,
      durationMs: returning ? STUDENT_RACE_ANIMATION_CONFIG.kartPoses.turboReturnMs : poseFadeMs });
  }

  updateAura(aura, reducedMotion, deltaMs) {
    const target = aura?.alpha ?? 0;
    if (aura != null) {
      this.aura.tint = aura.color;
      this.auraPeakAlpha = target;
    }
    const step = Math.max(0, deltaMs) / poseFadeMs * this.auraPeakAlpha;
    const difference = target - this.aura.alpha;
    this.aura.alpha = reducedMotion ? target
      : this.aura.alpha + Math.sign(difference) * Math.min(Math.abs(difference), step);
    this.aura.visible = this.aura.alpha > 0;
  }
}
