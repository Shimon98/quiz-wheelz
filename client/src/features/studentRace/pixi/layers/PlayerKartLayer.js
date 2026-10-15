import { Graphics } from "pixi.js";

import { getRaceGameplayPresentation } from "../../config/raceGameplayPresentationConfig.js";
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
const AURA_PULSE_DEPTH = 0.25;
const FULL_TURN_RADIANS = Math.PI * 2;

function createAura() {
  const aura = new Graphics();
  AURA_RINGS.forEach(({ radiusScale, alpha }) => {
    aura
      .ellipse(VEHICLE_UNIT_WIDTH / 2, VEHICLE_GROUND_Y, AURA_RADIUS_X * radiusScale, AURA_RADIUS_Y * radiusScale)
      .fill({ color: 0xffffff, alpha });
  });
  aura.blendMode = "add";
  aura.visible = false;
  return aura;
}

export class PlayerKartLayer extends StudentRaceVehicleVisual {
  constructor(...args) {
    super(...args);
    this.aura = createAura();
    this.root.addChildAt(this.aura, this.root.getChildIndex(this.kart));
  }

  update({ visualSpeed, deltaMs, layout, runtimeState, playerDepth = 1, vehicleVisualScale }) {
    const reducedMotion = runtimeState?.visual?.reducedMotion === true;
    this.setGroundTransform({ ...playerKartGroundTransform(layout), zIndex: playerDepth, visualScale: vehicleVisualScale });
    this.updateIdle({
      deltaMs,
      movementStrength: Math.abs(visualSpeed) / 2,
      reducedMotion,
    });
    this.updateAura(getRaceGameplayPresentation(runtimeState?.gameplay?.mode)?.kartAura ?? null, reducedMotion);
  }

  updateAura(aura, reducedMotion) {
    this.aura.visible = aura != null;
    if (aura == null) return;
    const pulse = aura.pulsePeriodMs != null && !reducedMotion
      ? 1 - AURA_PULSE_DEPTH + AURA_PULSE_DEPTH * Math.sin((this.elapsedMs / aura.pulsePeriodMs) * FULL_TURN_RADIANS)
      : 1;
    this.aura.tint = aura.color;
    this.aura.alpha = aura.alpha * pulse;
  }
}
