import { ApiContractError } from "../../../errors/ApiContractError.js";
import {
  requireArray,
  requireFiniteNumber,
  requireNonEmptyString,
  requireObject,
  requireSafeInteger,
} from "../../../errors/apiContractGuards.js";
import { RACE_GAMEPLAY_MODES } from "../../../constants/raceGameplayConstants.js";

export function createDefaultStudentRaceGameplay() {
  return { mode: RACE_GAMEPLAY_MODES.NORMAL, effectiveSpeed: null, activeEffects: [] };
}

function mapOrNull(mapper, value) {
  try {
    return mapper(value);
  } catch (error) {
    if (error instanceof ApiContractError) return null;
    throw error;
  }
}

function mapActiveEffect(raw) {
  requireObject(raw, "Gameplay effect");
  const startsAtEpochMs = requireSafeInteger(raw.startsAtEpochMs, "Gameplay effect start", { min: 1 });
  const endsAtEpochMs = requireSafeInteger(raw.endsAtEpochMs, "Gameplay effect end", { min: 1 });

  if (endsAtEpochMs <= startsAtEpochMs) {
    throw new ApiContractError("Gameplay effect end is invalid");
  }

  return {
    effectId: requireSafeInteger(raw.effectId, "Gameplay effect id", { min: 1 }),
    type: requireNonEmptyString(raw.type, "Gameplay effect type"),
    source: requireNonEmptyString(raw.source, "Gameplay effect source"),
    magnitudeTenths: raw.magnitudeTenths == null
      ? null
      : requireSafeInteger(raw.magnitudeTenths, "Gameplay effect magnitude"),
    startsAtEpochMs,
    endsAtEpochMs,
  };
}

function mapGameplay(raw) {
  requireObject(raw, "Gameplay");

  return {
    mode: requireNonEmptyString(raw.mode, "Gameplay mode"),
    effectiveSpeed: requireFiniteNumber(raw.effectiveSpeed, "Gameplay effective speed", { min: 0 }),
    activeEffects: requireArray(raw.activeEffects, "Gameplay effects")
      .map((effect) => mapOrNull(mapActiveEffect, effect))
      .filter(Boolean),
  };
}

export function mapStudentRaceGameplay(raw) {
  return mapOrNull(mapGameplay, raw) ?? createDefaultStudentRaceGameplay();
}

export function resolveStudentRacePresentationSpeed(baseSpeed, gameplay) {
  return gameplay?.effectiveSpeed ?? baseSpeed;
}
