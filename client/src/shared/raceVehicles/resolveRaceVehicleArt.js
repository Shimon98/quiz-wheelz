export function resolveRaceVehicleArt(vehicleAssetKey, art) {
  if (typeof vehicleAssetKey !== "string" || vehicleAssetKey === "") {
    return null;
  }

  return Object.hasOwn(art, vehicleAssetKey) ? art[vehicleAssetKey] : null;
}
