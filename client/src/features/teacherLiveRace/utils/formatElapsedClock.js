const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

function padClockUnit(value) {
  return String(value).padStart(2, "0");
}

export function formatElapsedClock(elapsedMs) {
  if (elapsedMs == null || !Number.isFinite(elapsedMs)) {
    return null;
  }

  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR;
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours === 0) {
    return `${padClockUnit(minutes)}:${padClockUnit(seconds)}`;
  }

  return `${hours}:${padClockUnit(minutes)}:${padClockUnit(seconds)}`;
}
