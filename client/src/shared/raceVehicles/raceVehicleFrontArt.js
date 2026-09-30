import hoverKartGreenFront from "../../assets/game/raceResults/heroKarts/hover-kart-green-front.webp";
import hoverKartPurpleFront from "../../assets/game/raceResults/heroKarts/hover-kart-purple-front.webp";
import hoverKartRedFront from "../../assets/game/raceResults/heroKarts/hover-kart-red-front.webp";
import hoverKartBlueFront from "../../assets/game/raceResults/heroKarts/hover-kart-blue-front.webp";
import hoverKartOrangeFront from "../../assets/game/raceResults/heroKarts/hover-kart-orange-front.webp";
import hoverKartPinkFront from "../../assets/game/raceResults/heroKarts/hover-kart-pink-front.webp";
import hoverKartYellowFront from "../../assets/game/raceResults/heroKarts/hover-kart-yellow-front.webp";
import hoverKartCyanFront from "../../assets/game/raceResults/heroKarts/hover-kart-cyan-front.webp";
import { resolveRaceVehicleArt } from "./resolveRaceVehicleArt";

export const RACE_VEHICLE_FRONT_ART = Object.freeze({
  TOY_CAR_GREEN: hoverKartGreenFront,
  TOY_CAR_PURPLE: hoverKartPurpleFront,
  TOY_CAR_RED: hoverKartRedFront,
  TOY_CAR_BLUE: hoverKartBlueFront,
  TOY_CAR_ORANGE: hoverKartOrangeFront,
  TOY_CAR_PINK: hoverKartPinkFront,
  TOY_CAR_YELLOW: hoverKartYellowFront,
  TOY_CAR_CYAN: hoverKartCyanFront,
});

export function resolveRaceVehicleFrontArt(vehicleAssetKey, art = RACE_VEHICLE_FRONT_ART) {
  return resolveRaceVehicleArt(vehicleAssetKey, art);
}
