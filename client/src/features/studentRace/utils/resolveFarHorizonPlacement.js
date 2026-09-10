export function resolveFarHorizonPlacement({
  centerX,
  frameWidth,
  horizonY,
  textureWidth,
  textureHeight,
  farConfig,
}) {
  const width = frameWidth * farConfig.widthScale;
  const scale = width / textureWidth;
  const height = textureHeight * scale;

  return {
    x: centerX - width * farConfig.openingXRatio,
    y: horizonY - height * farConfig.horizonAnchorYRatio,
    width,
    height,
  };
}
