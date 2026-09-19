export const RACE_VEHICLE_COLOR_KEYS = Object.freeze({
  PURPLE: "PURPLE",
  RED: "RED",
  BLUE: "BLUE",
  GREEN: "GREEN",
  ORANGE: "ORANGE",
  PINK: "PINK",
  YELLOW: "YELLOW",
  CYAN: "CYAN",
});

export const RACE_VEHICLE_BODY_COLORS = Object.freeze({
  [RACE_VEHICLE_COLOR_KEYS.PURPLE]: 0xa95cff,
  [RACE_VEHICLE_COLOR_KEYS.RED]: 0xf04a42,
  [RACE_VEHICLE_COLOR_KEYS.BLUE]: 0x4285f4,
  [RACE_VEHICLE_COLOR_KEYS.GREEN]: 0x2fa84f,
  [RACE_VEHICLE_COLOR_KEYS.ORANGE]: 0xff9632,
  [RACE_VEHICLE_COLOR_KEYS.PINK]: 0xf56ab4,
  [RACE_VEHICLE_COLOR_KEYS.YELLOW]: 0xf5d63b,
  [RACE_VEHICLE_COLOR_KEYS.CYAN]: 0x32d7ed,
});

const HEX_RADIX = 16;
const HEX_LENGTH = 6;

export function resolveVehicleCssColor(vehicleColorKey) {
  if (!Object.hasOwn(RACE_VEHICLE_BODY_COLORS, vehicleColorKey)) {
    return null;
  }

  return `#${RACE_VEHICLE_BODY_COLORS[vehicleColorKey]
    .toString(HEX_RADIX)
    .padStart(HEX_LENGTH, "0")}`;
}
