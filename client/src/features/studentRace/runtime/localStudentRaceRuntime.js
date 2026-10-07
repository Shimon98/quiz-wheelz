import {
  RACE_STATUSES,
  RACE_PLAYER_STATUSES,
} from "../../../constants/raceStatusConstants";
import {
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_EFFECT_TYPES,
  RACE_GAMEPLAY_MODES,
} from "../../../constants/raceGameplayConstants";

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
const DEV_SLOWDOWN = Object.freeze({ fromMs: 3000, toMs: 8000, magnitudeTenths: 3 });
const DEV_MIN_EFFECTIVE_SPEED_TENTHS = 1;
const DEV_FUTURE_EFFECT_DURATION_MS = 60000;
const DEV_FUTURE_MODE = "FUTURE_MODE";

function resolveMotionScenario() {
  return new URLSearchParams(globalThis.location?.search ?? "").get("motionScenario");
}

export function createLocalStudentRaceRuntime({ scenario = resolveMotionScenario() } = {}) {
  let position = scenario === "finish" ? DEV_FINISH_PREVIEW_POSITION : 0;
  let speed = scenario === "boost" ? DEV_BOOST_INITIAL_SPEED : DEV_SPEED;
  let elapsedMs = 0;
  let snapshotAtEpochMs = Date.now();
  const startedAtEpochMs = snapshotAtEpochMs;
  let intervalId = null;
  const listeners = new Set();

  const isSlowed = () => scenario === "slowdown"
    && elapsedMs >= DEV_SLOWDOWN.fromMs && elapsedMs < DEV_SLOWDOWN.toMs;

  const effectiveSpeed = () => (isSlowed()
    ? Math.max(DEV_MIN_EFFECTIVE_SPEED_TENTHS, Math.round(speed * 10) - DEV_SLOWDOWN.magnitudeTenths) / 10
    : speed);

  const activeEffects = () => {
    if (isSlowed()) {
      return [{
        effectId: 1,
        type: RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW,
        source: RACE_GAMEPLAY_EFFECT_SOURCES.CHALLENGE_TIMEOUT,
        magnitudeTenths: DEV_SLOWDOWN.magnitudeTenths,
        startsAtEpochMs: startedAtEpochMs + DEV_SLOWDOWN.fromMs,
        endsAtEpochMs: startedAtEpochMs + DEV_SLOWDOWN.toMs,
      }];
    }
    if (scenario === "future-effect") {
      return [{
        effectId: 2,
        type: "FUTURE_EFFECT",
        source: "FUTURE_SOURCE",
        magnitudeTenths: null,
        startsAtEpochMs: startedAtEpochMs,
        endsAtEpochMs: startedAtEpochMs + DEV_FUTURE_EFFECT_DURATION_MS,
      }];
    }
    return [];
  };

  const getSnapshot = () => {
    const finished = position === DEV_TOTAL_DISTANCE;
    const currentEffectiveSpeed = finished ? 0 : effectiveSpeed();
    return {
      raceStatus: RACE_STATUSES.IN_PROGRESS,
      playerStatus: finished ? RACE_PLAYER_STATUSES.FINISHED : RACE_PLAYER_STATUSES.RACING,
      playerFinished: finished,
      totalDistance: DEV_TOTAL_DISTANCE,
      position,
      speed,
      movementUnitsPerSecond: currentEffectiveSpeed * DEV_UNITS_PER_SECOND_AT_SPEED_1,
      gameplay: {
        mode: scenario === "future-mode" ? DEV_FUTURE_MODE : RACE_GAMEPLAY_MODES.NORMAL,
        effectiveSpeed: currentEffectiveSpeed,
        activeEffects: finished ? [] : activeEffects(),
      },
      snapshotAtEpochMs,
      vehicleAssetKey: DEV_VEHICLE_ASSET_KEY,
    };
  };

  const tick = () => {
    elapsedMs += LOCAL_TICK_MS;
    position += effectiveSpeed() * DEV_UNITS_PER_SECOND_AT_SPEED_1 * (LOCAL_TICK_MS / 1000);
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
