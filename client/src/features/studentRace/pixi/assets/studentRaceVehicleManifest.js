import hoverKartGreenIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-green-idle-01.webp";
import hoverKartPurpleIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-purple-idle-01.webp";
import hoverKartRedIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-red-idle-01.webp";
import hoverKartBlueIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-blue-idle-01.webp";
import hoverKartOrangeIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-orange-idle-01.webp";
import hoverKartPinkIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-pink-idle-01.webp";
import hoverKartYellowIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-yellow-idle-01.webp";
import hoverKartCyanIdle01 from "../../../../assets/game/studentRace/hoverKarts/hover-kart-cyan-idle-01.webp";

const GREEN_MASTER = Object.freeze({
  idleFrames: [hoverKartGreenIdle01],
  anchorX: 0.5,
  anchorY: 0.96,
  baseScale: 1.08,
});

const variant = (frame, bodyColor) => Object.freeze({ ...GREEN_MASTER, idleFrames: [frame], bodyColor });

export const STUDENT_RACE_VEHICLE_MANIFEST = Object.freeze({
  TOY_CAR_GREEN: GREEN_MASTER,
  TOY_CAR_PURPLE: variant(hoverKartPurpleIdle01, 0xa95cff),
  TOY_CAR_RED: variant(hoverKartRedIdle01, 0xf04a42),
  TOY_CAR_BLUE: variant(hoverKartBlueIdle01, 0x4285f4),
  TOY_CAR_ORANGE: variant(hoverKartOrangeIdle01, 0xff9632),
  TOY_CAR_PINK: variant(hoverKartPinkIdle01, 0xf56ab4),
  TOY_CAR_YELLOW: variant(hoverKartYellowIdle01, 0xf5d63b),
  TOY_CAR_CYAN: variant(hoverKartCyanIdle01, 0x32d7ed),
});
