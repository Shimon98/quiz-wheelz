import { ApiContractError } from "../../../errors/ApiContractError.js";
import {
  mapOrNull,
  requireArray,
  requireFiniteNumber,
  requireNonEmptyString,
  requireObject,
  requireSafeInteger,
} from "../../../errors/apiContractGuards.js";
import { RACE_GAMEPLAY_MODES } from "../../../constants/raceGameplayConstants.js";
import { mapStudentRaceChallenge } from "./mapStudentRaceChallenge.js";

// A snapshot from before power-ups and Luck, or a malformed part of one, means no shield and no Luck history.
const NO_POWER_UPS = Object.freeze({ guardShieldCharges: 0, guardShieldAwardQuestionId: null });
const NO_LUCK = Object.freeze({ recentEvents: Object.freeze([]) });

export function createDefaultStudentRaceGameplay() {
  return {
    mode: RACE_GAMEPLAY_MODES.NORMAL,
    effectiveSpeed: null,
    activeEffects: [],
    challenge: null,
    powerUps: NO_POWER_UPS,
    luck: NO_LUCK,
  };
}

// The award question is history: only the charges say whether a shield is up.
function mapPowerUps(raw) {
  requireObject(raw, "Gameplay power-ups");

  return {
    guardShieldCharges: requireSafeInteger(raw.guardShieldCharges, "Guard shield charges", { min: 0 }),
    guardShieldAwardQuestionId: raw.guardShieldAwardQuestionId == null
      ? null
      : requireSafeInteger(raw.guardShieldAwardQuestionId, "Guard shield award question", { min: 1 }),
  };
}

// Types and outcomes stay strings: a value from a newer server is kept and simply not presented.
function mapLuckEvent(raw) {
  requireObject(raw, "Luck event");

  return {
    eventId: requireSafeInteger(raw.eventId, "Luck event id", { min: 1 }),
    selectedType: requireNonEmptyString(raw.selectedType, "Luck selected type"),
    appliedType: requireNonEmptyString(raw.appliedType, "Luck applied type"),
    outcome: requireNonEmptyString(raw.outcome, "Luck outcome"),
    occurredAtEpochMs: requireSafeInteger(raw.occurredAtEpochMs, "Luck event time", { min: 1 }),
  };
}

function mapLuck(raw) {
  requireObject(raw, "Gameplay luck");

  return {
    recentEvents: requireArray(raw.recentEvents, "Luck events")
      .map((event) => mapOrNull(mapLuckEvent, event))
      .filter(Boolean),
  };
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

function mapGameplay(raw, clock) {
  requireObject(raw, "Gameplay");

  return {
    mode: requireNonEmptyString(raw.mode, "Gameplay mode"),
    effectiveSpeed: requireFiniteNumber(raw.effectiveSpeed, "Gameplay effective speed", { min: 0 }),
    activeEffects: requireArray(raw.activeEffects, "Gameplay effects")
      .map((effect) => mapOrNull(mapActiveEffect, effect))
      .filter(Boolean),
    challenge: mapStudentRaceChallenge(raw.challenge, clock),
    powerUps: mapOrNull(mapPowerUps, raw.powerUps) ?? NO_POWER_UPS,
    luck: mapOrNull(mapLuck, raw.luck) ?? NO_LUCK,
  };
}

export function mapStudentRaceGameplay(raw, clock = {}) {
  return mapOrNull((gameplay) => mapGameplay(gameplay, clock), raw) ?? createDefaultStudentRaceGameplay();
}

export function resolveStudentRacePresentationSpeed(baseSpeed, gameplay) {
  return gameplay?.effectiveSpeed ?? baseSpeed;
}
