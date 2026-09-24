const REM_DECIMALS = 4;

function roundRem(value) {
  return Number(value.toFixed(REM_DECIMALS));
}

function resolveVehicleBox(heightRem, { vehicleAspectRatio, vehicleEdgeGapRem }) {
  const widthRem = heightRem * vehicleAspectRatio;

  return {
    heightRem,
    widthRem: roundRem(widthRem),
    railInsetRem: roundRem(widthRem / 2 + vehicleEdgeGapRem),
  };
}

export function resolveTeacherVehicleGeometry(laneGeometry) {
  return {
    compact: resolveVehicleBox(laneGeometry.compactVehicleHeightRem, laneGeometry),
    wide: resolveVehicleBox(laneGeometry.wideVehicleHeightRem, laneGeometry),
  };
}
