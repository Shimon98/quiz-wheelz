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

// The Guard Shield bubble in kart-local units. Tall enough to clear the driver's helmet; its foot stays on the road.
// The standing shield and the hit it blocks draw the same bubble.
export const KART_SHIELD_BUBBLE = Object.freeze({ x: VEHICLE_UNIT_WIDTH / 2, y: 8, radiusX: 66, radiusY: 58 });

// The player's kart as the screen sees it: its ground point and screen pixels per kart-local unit, the transform
// setGroundTransform gives the kart's root (the bob aside), so effects drawn outside the kart still fit it.
export function playerKartFrame(layout, vehicleVisualScale) {
  const { x, y, width } = playerKartGroundTransform(layout);
  return { x, y, scale: width / VEHICLE_UNIT_WIDTH * vehicleVisualScale };
}

export function kartLocalToScreen(frame, x, y) {
  return {
    x: frame.x + (x - VEHICLE_UNIT_WIDTH / 2) * frame.scale,
    y: frame.y + (y - VEHICLE_GROUND_Y) * frame.scale,
  };
}
