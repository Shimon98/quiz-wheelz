import { Assets } from "pixi.js";

import { STUDENT_RACE_VEHICLE_MANIFEST } from "./studentRaceVehicleManifest.js";

/*
 * Resolver + selective loader for the player's vehicle art. An unknown or
 * unloadable server asset key must keep the race playable: the caller
 * (C1-06C) keeps the existing Graphics placeholder on any fallback result —
 * never silently substitutes another vehicle's art.
 */

export const VEHICLE_ASSET_STATUS = Object.freeze({
  LOADED: "loaded",
  FALLBACK: "fallback",
});

export const VEHICLE_ASSET_FALLBACK_REASON = Object.freeze({
  UNKNOWN_KEY: "UNKNOWN_KEY",
  INVALID_DEFINITION: "INVALID_DEFINITION",
  LOAD_FAILED: "LOAD_FAILED",
});

/** @returns the manifest definition for the key, or null when unknown. */
export function resolveStudentRaceVehicleAsset(
  vehicleAssetKey,
  manifest = STUDENT_RACE_VEHICLE_MANIFEST,
) {
  if (typeof vehicleAssetKey !== "string" || vehicleAssetKey === "") {
    return null;
  }

  return Object.hasOwn(manifest, vehicleAssetKey)
    ? manifest[vehicleAssetKey]
    : null;
}

function isUsableDefinition(definition) {
  return (
    definition != null &&
    typeof definition === "object" &&
    Array.isArray(definition.idleFrames) &&
    definition.idleFrames.length > 0 &&
    definition.idleFrames.every(
      (frameUrl) => typeof frameUrl === "string" && frameUrl !== "",
    ) &&
    Number.isFinite(definition.anchorX) &&
    Number.isFinite(definition.anchorY) &&
    Number.isFinite(definition.baseScale) &&
    definition.baseScale > 0
  );
}

// One concise developer warning per key+reason — never per frame/render.
const warnedFallbacks = new Set();

function fallbackResult(vehicleAssetKey, reason, error) {
  const warnKey = `${vehicleAssetKey}:${reason}`;
  if (!warnedFallbacks.has(warnKey)) {
    warnedFallbacks.add(warnKey);
    console.warn(
      `Student race vehicle asset unavailable: ${vehicleAssetKey} (${reason})`,
    );
  }

  return error === undefined
    ? { status: VEHICLE_ASSET_STATUS.FALLBACK, vehicleAssetKey, reason }
    : { status: VEHICLE_ASSET_STATUS.FALLBACK, vehicleAssetKey, reason, error };
}

/**
 * Loads ONLY the requested vehicle's idle frames (never the whole manifest)
 * and resolves to either
 *   { status: "loaded", vehicleAssetKey, definition, textures } — textures in
 *   idleFrames order — or
 *   { status: "fallback", vehicleAssetKey, reason, error? }.
 * Never rejects.
 */
export async function loadStudentRaceVehicleAssets(
  vehicleAssetKey,
  {
    manifest = STUDENT_RACE_VEHICLE_MANIFEST,
    loadTexture = (frameUrl) => Assets.load(frameUrl),
  } = {},
) {
  const definition = resolveStudentRaceVehicleAsset(vehicleAssetKey, manifest);

  if (definition == null) {
    return fallbackResult(
      vehicleAssetKey,
      VEHICLE_ASSET_FALLBACK_REASON.UNKNOWN_KEY,
    );
  }

  if (!isUsableDefinition(definition)) {
    return fallbackResult(
      vehicleAssetKey,
      VEHICLE_ASSET_FALLBACK_REASON.INVALID_DEFINITION,
    );
  }

  try {
    const textures = await Promise.all(
      definition.idleFrames.map((frameUrl) => loadTexture(frameUrl)),
    );

    return {
      status: VEHICLE_ASSET_STATUS.LOADED,
      vehicleAssetKey,
      definition,
      textures,
    };
  } catch (error) {
    return fallbackResult(
      vehicleAssetKey,
      VEHICLE_ASSET_FALLBACK_REASON.LOAD_FAILED,
      error,
    );
  }
}
