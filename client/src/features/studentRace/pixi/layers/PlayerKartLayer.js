import { StudentRaceVehicleVisual } from "../vehicles/StudentRaceVehicleVisual.js";
import { playerKartGroundTransform } from "../vehicles/studentRaceVehicleGeometry.js";

export class PlayerKartLayer extends StudentRaceVehicleVisual {
  update({ visualSpeed, deltaMs, layout, runtimeState, playerDepth = 1, vehicleVisualScale }) {
    this.setGroundTransform({ ...playerKartGroundTransform(layout), zIndex: playerDepth, visualScale: vehicleVisualScale });
    this.updateIdle({
      deltaMs,
      movementStrength: Math.abs(visualSpeed) / 2,
      reducedMotion: runtimeState?.visual?.reducedMotion === true,
    });
  }
}
