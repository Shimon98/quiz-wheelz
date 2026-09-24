import hoverKartGreenIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-idle-01.webp";
import hoverKartPurpleIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-purple-idle-01.webp";
import hoverKartRedIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-red-idle-01.webp";
import hoverKartBlueIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-blue-idle-01.webp";
import hoverKartOrangeIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-orange-idle-01.webp";
import hoverKartPinkIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-pink-idle-01.webp";
import hoverKartYellowIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-yellow-idle-01.webp";
import hoverKartCyanIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-cyan-idle-01.webp";
import { RACE_VEHICLE_BODY_COLORS } from "../../../../shared/raceVehicles/raceVehicleIdentity";

const GREEN_MASTER = Object.freeze({
  idleFrames: [hoverKartGreenIdle01],
  anchorX: 0.5,
  anchorY: 0.96,
  baseScale: 1.08,
});

const variant = (frame, bodyColor) => Object.freeze({ ...GREEN_MASTER, idleFrames: [frame], bodyColor });

export const STUDENT_RACE_VEHICLE_MANIFEST = Object.freeze({
  TOY_CAR_GREEN: GREEN_MASTER,
  TOY_CAR_PURPLE: variant(hoverKartPurpleIdle01, RACE_VEHICLE_BODY_COLORS.PURPLE),
  TOY_CAR_RED: variant(hoverKartRedIdle01, RACE_VEHICLE_BODY_COLORS.RED),
  TOY_CAR_BLUE: variant(hoverKartBlueIdle01, RACE_VEHICLE_BODY_COLORS.BLUE),
  TOY_CAR_ORANGE: variant(hoverKartOrangeIdle01, RACE_VEHICLE_BODY_COLORS.ORANGE),
  TOY_CAR_PINK: variant(hoverKartPinkIdle01, RACE_VEHICLE_BODY_COLORS.PINK),
  TOY_CAR_YELLOW: variant(hoverKartYellowIdle01, RACE_VEHICLE_BODY_COLORS.YELLOW),
  TOY_CAR_CYAN: variant(hoverKartCyanIdle01, RACE_VEHICLE_BODY_COLORS.CYAN),
});
