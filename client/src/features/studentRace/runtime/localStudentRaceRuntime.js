import {
  RACE_STATUSES,
  RACE_PLAYER_STATUSES,
} from "../../../constants/raceStatusConstants";

/*
 * DEV-ONLY visual movement source for the Pixi renderer, used until the
 * server provides live movement (24E). It rehearses exactly the future
 * data flow: low-rate snapshots in, renderer interpolation smooths them out.
 *
 * It deliberately does NOT generate questions/answers, compute score or
 * correctness, or declare a real finish — the server is the source of truth
 * for all of those; this file only feeds movement to the eyes.
 */

// Dev stand-ins — intentionally local to this file, never in shared config
// (the real values arrive from the server's race-state / snapshots).
const LOCAL_TICK_MS = 500; // matches the planned 24E snapshot cadence
const DEV_TOTAL_DISTANCE = 1000;
const DEV_SPEED = 1.2; // server speed units
const DEV_UNITS_PER_SECOND_AT_SPEED_1 = 30; // dev movement feel; tune freely

export function createLocalStudentRaceRuntime() {
  let position = 0;
  let speed = DEV_SPEED;
  let intervalId = null;
  const listeners = new Set();

  const getSnapshot = () => ({
    raceStatus: RACE_STATUSES.IN_PROGRESS,
    playerStatus: RACE_PLAYER_STATUSES.RACING,
    totalDistance: DEV_TOTAL_DISTANCE,
    position,
    speed,
  });

  const tick = () => {
    const dtSeconds = LOCAL_TICK_MS / 1000;
    // Wraps at the track end so dev movement never stops — a real finish is
    // a server decision this runtime must never fake.
    position =
      (position + speed * DEV_UNITS_PER_SECOND_AT_SPEED_1 * dtSeconds) %
      DEV_TOTAL_DISTANCE;

    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    start() {
      if (intervalId == null) {
        intervalId = setInterval(tick, LOCAL_TICK_MS);
      }
    },

    stop() {
      clearInterval(intervalId);
      intervalId = null;
    },

    getSnapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
