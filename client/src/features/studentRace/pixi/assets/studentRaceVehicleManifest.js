import hoverKartGreenIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-idle-01.webp";
import hoverKartPurpleIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-purple-idle-01.webp";
import hoverKartRedIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-red-idle-01.webp";
import hoverKartBlueIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-blue-idle-01.webp";
import hoverKartOrangeIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-orange-idle-01.webp";
import hoverKartPinkIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-pink-idle-01.webp";
import hoverKartYellowIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-yellow-idle-01.webp";
import hoverKartCyanIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-cyan-idle-01.webp";
import hoverKartGreenSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-safe-01.webp";
import hoverKartGreenTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-turbo-01.webp";
import hoverKartPurpleSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-purple-safe-01.webp";
import hoverKartPurpleTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-purple-turbo-01.webp";
import hoverKartRedSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-red-safe-01.webp";
import hoverKartRedTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-red-turbo-01.webp";
import hoverKartBlueSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-blue-safe-01.webp";
import hoverKartBlueTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-blue-turbo-01.webp";
import hoverKartOrangeSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-orange-safe-01.webp";
import hoverKartOrangeTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-orange-turbo-01.webp";
import hoverKartPinkSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-pink-safe-01.webp";
import hoverKartPinkTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-pink-turbo-01.webp";
import hoverKartYellowSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-yellow-safe-01.webp";
import hoverKartYellowTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-yellow-turbo-01.webp";
import hoverKartCyanSafe01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-cyan-safe-01.webp";
import hoverKartCyanTurbo01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-cyan-turbo-01.webp";
import { RACE_GAMEPLAY_MODES } from "../../../../constants/raceGameplayConstants";
import { RACE_VEHICLE_BODY_COLORS } from "../../../../shared/raceVehicles/raceVehicleIdentity";

// Challenge poses: the same kart body pixels as the idle frame, only the monkey changes (C5-03).
const poses = (safe, turbo) => Object.freeze({ [RACE_GAMEPLAY_MODES.SAFE_RUN]: safe, [RACE_GAMEPLAY_MODES.TURBO_TRIAL]: turbo });

const GREEN_MASTER = Object.freeze({
  idleFrames: [hoverKartGreenIdle01],
  anchorX: 0.5,
  anchorY: 0.96,
  baseScale: 1.08,
  // Rear thruster glow centres and radius in the 768 px art, measured; identical on every color.
  thrusters: Object.freeze([Object.freeze({ x: 161.4, y: 583.2 }), Object.freeze({ x: 604.5, y: 582.5 })]),
  thrusterRadius: 44,
  poses: poses(hoverKartGreenSafe01, hoverKartGreenTurbo01),
});

const variant = (frame, bodyColor, posesForColor) => Object.freeze({
  ...GREEN_MASTER, idleFrames: [frame], bodyColor, poses: posesForColor,
});

export const STUDENT_RACE_VEHICLE_MANIFEST = Object.freeze({
  TOY_CAR_GREEN: GREEN_MASTER,
  TOY_CAR_PURPLE: variant(hoverKartPurpleIdle01, RACE_VEHICLE_BODY_COLORS.PURPLE, poses(hoverKartPurpleSafe01, hoverKartPurpleTurbo01)),
  TOY_CAR_RED: variant(hoverKartRedIdle01, RACE_VEHICLE_BODY_COLORS.RED, poses(hoverKartRedSafe01, hoverKartRedTurbo01)),
  TOY_CAR_BLUE: variant(hoverKartBlueIdle01, RACE_VEHICLE_BODY_COLORS.BLUE, poses(hoverKartBlueSafe01, hoverKartBlueTurbo01)),
  TOY_CAR_ORANGE: variant(hoverKartOrangeIdle01, RACE_VEHICLE_BODY_COLORS.ORANGE, poses(hoverKartOrangeSafe01, hoverKartOrangeTurbo01)),
  TOY_CAR_PINK: variant(hoverKartPinkIdle01, RACE_VEHICLE_BODY_COLORS.PINK, poses(hoverKartPinkSafe01, hoverKartPinkTurbo01)),
  TOY_CAR_YELLOW: variant(hoverKartYellowIdle01, RACE_VEHICLE_BODY_COLORS.YELLOW, poses(hoverKartYellowSafe01, hoverKartYellowTurbo01)),
  TOY_CAR_CYAN: variant(hoverKartCyanIdle01, RACE_VEHICLE_BODY_COLORS.CYAN, poses(hoverKartCyanSafe01, hoverKartCyanTurbo01)),
});
