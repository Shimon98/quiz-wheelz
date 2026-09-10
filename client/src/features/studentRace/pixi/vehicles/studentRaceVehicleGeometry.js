export const VEHICLE_UNIT_WIDTH = 100;
export const VEHICLE_UNIT_HEIGHT = 64;
export const VEHICLE_GROUND_Y = VEHICLE_UNIT_HEIGHT * 0.92;

export function playerKartGroundTransform(layout) {
  const { maxWidth, anchorX, anchorY } = layout.playerKart;
  return { x: anchorX, width: maxWidth,
    y: anchorY + (VEHICLE_GROUND_Y - VEHICLE_UNIT_HEIGHT / 2) * maxWidth / VEHICLE_UNIT_WIDTH };
}
