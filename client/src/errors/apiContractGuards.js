import { ApiContractError } from "./ApiContractError";

export function requireObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiContractError(`${label} is missing`);
  }

  return value;
}

export function requireArray(value, label, { maxLength = Infinity } = {}) {
  if (!Array.isArray(value) || value.length > maxLength) {
    throw new ApiContractError(`${label} is invalid`);
  }

  return value;
}

export function requireSafeInteger(
  value,
  label,
  { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {},
) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new ApiContractError(`${label} is invalid`);
  }

  return value;
}

export function requireFiniteNumber(
  value,
  label,
  { min = Number.NEGATIVE_INFINITY } = {},
) {
  if (!Number.isFinite(value) || value < min) {
    throw new ApiContractError(`${label} is invalid`);
  }

  return value;
}

export function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiContractError(`${label} is invalid`);
  }

  return value;
}

export function requireOneOf(value, allowedValues, label) {
  if (!allowedValues.has(value)) {
    throw new ApiContractError(`${label} is invalid`);
  }

  return value;
}

export function requireOptionalEpochMs(value, label) {
  if (value == null) {
    return null;
  }

  return requireSafeInteger(value, label, { min: 1 });
}
