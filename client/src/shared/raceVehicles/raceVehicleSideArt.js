import hoverKartGreenSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-green-side.webp";
import hoverKartPurpleSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-purple-side.webp";
import hoverKartRedSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-red-side.webp";
import hoverKartBlueSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-blue-side.webp";
import hoverKartOrangeSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-orange-side.webp";
import hoverKartPinkSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-pink-side.webp";
import hoverKartYellowSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-yellow-side.webp";
import hoverKartCyanSide from "../../assets/game/teacherRace/hoverKarts/hover-kart-cyan-side.webp";
import { resolveRaceVehicleArt } from "./resolveRaceVehicleArt";

export const RACE_VEHICLE_SIDE_ART = Object.freeze({
  TOY_CAR_GREEN: hoverKartGreenSide,
  TOY_CAR_PURPLE: hoverKartPurpleSide,
  TOY_CAR_RED: hoverKartRedSide,
  TOY_CAR_BLUE: hoverKartBlueSide,
  TOY_CAR_ORANGE: hoverKartOrangeSide,
  TOY_CAR_PINK: hoverKartPinkSide,
  TOY_CAR_YELLOW: hoverKartYellowSide,
  TOY_CAR_CYAN: hoverKartCyanSide,
});

export function resolveRaceVehicleSideArt(vehicleAssetKey, art = RACE_VEHICLE_SIDE_ART) {
  return resolveRaceVehicleArt(vehicleAssetKey, art);
}
