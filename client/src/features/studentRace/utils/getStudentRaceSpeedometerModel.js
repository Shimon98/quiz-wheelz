const DIAL_VISUAL_MIDPOINT = 1;
const DIAL_SWEEP_DEGREES = 180;
const DIAL_PATH_LENGTH = 100;

export function getStudentRaceSpeedometerModel(speed) {
  if (!Number.isFinite(speed) || speed < 0) return null;

  const ratio = speed / (speed + DIAL_VISUAL_MIDPOINT);

  return {
    valueText: `×${speed.toFixed(1)}`,
    needleStyle: { transform: `rotate(${ratio * DIAL_SWEEP_DEGREES}deg)` },
    arcStyle: { strokeDashoffset: DIAL_PATH_LENGTH * (1 - ratio) },
  };
}
