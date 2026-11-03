import { STUDENT_RACE_EFFECT_ART } from "../assets/studentRaceEffectManifest";

const WHITE = 0xffffff;
const RING_MIDDLE = STUDENT_RACE_EFFECT_ART.burstRing.radius;

// Approved art at its own alpha. Graphics.texture takes its alpha from the fill style, which every fill leaves
// behind, so the alpha is set inside a saved state and the brush comes back as it was. The context's rotate turns
// any translate already made, so the art turns first and moves second.
export function paintArt(g, texture, {
  x, y, width, height = width * texture.height / texture.width, alpha, rotation = 0, anchorX = 0.5, anchorY = 0.5,
  tint = WHITE,
}) {
  if (!(alpha > 0) || !(width > 0) || !(height > 0)) return;
  g.save().rotateTransform(rotation).translateTransform(x, y).setFillStyle({ alpha })
    .texture(texture, tint, -width * anchorX, -height * anchorY, width, height).restore();
}

// Astra's white burst ring, tinted, its middle line on the ellipse radiusX by radiusY around x, y.
export function paintRing(g, texture, { x, y, radiusX, radiusY = radiusX, alpha, tint }) {
  paintArt(g, texture, { x, y, width: 2 * radiusX / RING_MIDDLE, height: 2 * radiusY / RING_MIDDLE, alpha, tint });
}
