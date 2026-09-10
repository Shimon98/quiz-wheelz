import {
  RACE_STATUSES,
  RACE_PLAYER_STATUSES,
} from "../../../constants/raceStatusConstants";

const LOCAL_TICK_MS = 500;
const DEV_TOTAL_DISTANCE = 1000;
const DEV_SPEED = 1.2;
const DEV_UNITS_PER_SECOND_AT_SPEED_1 = 4;
const DEV_VEHICLE_ASSET_KEY = "TOY_CAR_GREEN";
const DEV_BOOST_AT_MS = 5000;
const DEV_BOOST_INITIAL_SPEED = 0.5;
const DEV_BOOST_POSITION = 10;
const DEV_BOOST_SPEED = 0.2;
const DEV_FINISH_PREVIEW_POSITION = 900;

function resolveMotionScenario() {
  return new URLSearchParams(globalThis.location?.search ?? "").get("motionScenario");
}

export function createLocalStudentRaceRuntime({ scenario = resolveMotionScenario() } = {}) {
  let position = scenario === "finish" ? DEV_FINISH_PREVIEW_POSITION : 0;
  let speed = scenario === "boost" ? DEV_BOOST_INITIAL_SPEED : DEV_SPEED;
  let elapsedMs = 0;
  let snapshotAtEpochMs = Date.now();
  let intervalId = null;
  const listeners = new Set();

  const getSnapshot = () => ({
    raceStatus: RACE_STATUSES.IN_PROGRESS,
    playerStatus: position === DEV_TOTAL_DISTANCE
      ? RACE_PLAYER_STATUSES.FINISHED
      : RACE_PLAYER_STATUSES.RACING,
    playerFinished: position === DEV_TOTAL_DISTANCE,
    totalDistance: DEV_TOTAL_DISTANCE,
    position,
    speed,
    movementUnitsPerSecond: position === DEV_TOTAL_DISTANCE
      ? 0
      : speed * DEV_UNITS_PER_SECOND_AT_SPEED_1,
    snapshotAtEpochMs,
    vehicleAssetKey: DEV_VEHICLE_ASSET_KEY,
  });

  const tick = () => {
    elapsedMs += LOCAL_TICK_MS;
    position += speed * DEV_UNITS_PER_SECOND_AT_SPEED_1 * (LOCAL_TICK_MS / 1000);
    if (scenario === "boost" && elapsedMs === DEV_BOOST_AT_MS) {
      position += DEV_BOOST_POSITION;
      speed += DEV_BOOST_SPEED;
    }
    position = scenario === "finish"
      ? Math.min(position, DEV_TOTAL_DISTANCE)
      : position % DEV_TOTAL_DISTANCE;
    snapshotAtEpochMs += LOCAL_TICK_MS;
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  return {
    start() {
      if (intervalId == null) intervalId = setInterval(tick, LOCAL_TICK_MS);
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
