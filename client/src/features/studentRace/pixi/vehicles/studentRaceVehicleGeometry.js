export const VEHICLE_UNIT_WIDTH = 100;
export const VEHICLE_UNIT_HEIGHT = 64;
export const VEHICLE_GROUND_Y = VEHICLE_UNIT_HEIGHT * 0.92;

// The art sprite's own transform: texture pixels to kart-local units.
export function artScale(textureWidth, baseScale) {
  return (VEHICLE_UNIT_WIDTH * baseScale) / textureWidth;
}

export function artPixelToKartLocal(pixel, texture, { anchorX, anchorY, baseScale }) {
  const scale = artScale(texture.width, baseScale);
  return {
    x: VEHICLE_UNIT_WIDTH / 2 + (pixel.x - texture.width * anchorX) * scale,
    y: VEHICLE_GROUND_Y + (pixel.y - texture.height * anchorY) * scale,
  };
}

export function playerKartGroundTransform(layout) {
  const { maxWidth, anchorX, anchorY } = layout.playerKart;
  return { x: anchorX, width: maxWidth,
    y: anchorY + (VEHICLE_GROUND_Y - VEHICLE_UNIT_HEIGHT / 2) * maxWidth / VEHICLE_UNIT_WIDTH };
}
