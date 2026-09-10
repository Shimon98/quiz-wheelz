import { StudentRaceVehicleVisual } from "../vehicles/StudentRaceVehicleVisual.js";
import { playerKartGroundTransform } from "../vehicles/studentRaceVehicleGeometry.js";

export class PlayerKartLayer extends StudentRaceVehicleVisual {
  update({ visualSpeed, deltaMs, layout, runtimeState }) {
    this.setGroundTransform(playerKartGroundTransform(layout));
    this.updateIdle({
      deltaMs,
      movementStrength: Math.abs(visualSpeed) / 2,
      reducedMotion: runtimeState?.visual?.reducedMotion === true,
    });
  }
}
