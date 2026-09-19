const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const RELATIVE_TIME_UNITS = Object.freeze({
  SECOND: "second",
  MINUTE: "minute",
  HOUR: "hour",
});

function toPastValue(amount) {
  return amount === 0 ? 0 : -amount;
}

export function resolveTeacherFeedRelativeTime(occurredAtEpochMs, serverNowEpochMs) {
  if (occurredAtEpochMs == null || serverNowEpochMs == null) {
    return null;
  }

  const ageSeconds = Math.floor(
    Math.max(0, serverNowEpochMs - occurredAtEpochMs) / MS_PER_SECOND,
  );

  if (ageSeconds < SECONDS_PER_MINUTE) {
    return { value: toPastValue(ageSeconds), unit: RELATIVE_TIME_UNITS.SECOND };
  }

  const ageMinutes = Math.floor(ageSeconds / SECONDS_PER_MINUTE);

  if (ageMinutes < MINUTES_PER_HOUR) {
    return { value: toPastValue(ageMinutes), unit: RELATIVE_TIME_UNITS.MINUTE };
  }

  return {
    value: toPastValue(Math.floor(ageMinutes / MINUTES_PER_HOUR)),
    unit: RELATIVE_TIME_UNITS.HOUR,
  };
}
