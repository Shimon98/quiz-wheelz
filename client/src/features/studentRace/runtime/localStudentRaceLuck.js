import {
  RACE_GAMEPLAY_EFFECT_SOURCES,
  RACE_GAMEPLAY_EFFECT_TYPES,
  RACE_LUCK_EVENT_TYPES,
  RACE_LUCK_OUTCOMES,
} from "../../../constants/raceGameplayConstants";

// One deterministic dev cycle (?motionScenario=luck) that shows every C5-04 presentation in turn: the shield up, a
// Tailwind, an Energy Orb, a Mud Splash the shield blocks, then a Mud Splash that lands. Display only: the real
// draws, windows and magnitudes belong to the server (LuckRules).
// A visual showcase, not one legal race (four events every 26 s; the server allows LuckRules.MAX_EVENTS, 45 s apart):
// it proves no balance and no contract, the server-made snapshots in serverLuckTestFixtures.js do.
const DEV_LUCK_CYCLE_MS = 26_000;
const DEV_LUCK_STEPS = Object.freeze([
  Object.freeze({ atMs: 6_000, appliedType: RACE_LUCK_EVENT_TYPES.TAILWIND, outcome: RACE_LUCK_OUTCOMES.APPLIED,
    window: Object.freeze({ type: RACE_GAMEPLAY_EFFECT_TYPES.SPEED_BOOST, tenths: 2, durationMs: 4_000 }) }),
  Object.freeze({ atMs: 12_000, appliedType: RACE_LUCK_EVENT_TYPES.ENERGY_ORB, outcome: RACE_LUCK_OUTCOMES.APPLIED }),
  Object.freeze({ atMs: 16_000, appliedType: RACE_LUCK_EVENT_TYPES.MUD_SPLASH,
    outcome: RACE_LUCK_OUTCOMES.BLOCKED_BY_SHIELD }),
  Object.freeze({ atMs: 20_000, appliedType: RACE_LUCK_EVENT_TYPES.MUD_SPLASH, outcome: RACE_LUCK_OUTCOMES.APPLIED,
    window: Object.freeze({ type: RACE_GAMEPLAY_EFFECT_TYPES.SPEED_SLOW, tenths: 1, durationMs: 3_000 }) }),
]);
// The server sends at most two Luck events per race player, oldest first.
const DEV_LUCK_HISTORY = 2;

export function createLocalStudentRaceLuck(startedAtEpochMs) {
  // The steps of the current cycle that have happened by now, as server-shaped events.
  const eventsAt = (nowEpochMs) => {
    const elapsedMs = Math.max(0, nowEpochMs - startedAtEpochMs);
    const cycle = Math.floor(elapsedMs / DEV_LUCK_CYCLE_MS);
    const cycleStartEpochMs = startedAtEpochMs + cycle * DEV_LUCK_CYCLE_MS;
    return DEV_LUCK_STEPS.flatMap((step, index) => (step.atMs <= elapsedMs - cycle * DEV_LUCK_CYCLE_MS ? [{
      eventId: cycle * DEV_LUCK_STEPS.length + index + 1,
      occurredAtEpochMs: cycleStartEpochMs + step.atMs,
      step,
    }] : []));
  };

  const activeEffects = (nowEpochMs) => eventsAt(nowEpochMs)
    .filter(({ step, occurredAtEpochMs }) => step.window != null
      && nowEpochMs < occurredAtEpochMs + step.window.durationMs)
    .map(({ eventId, step, occurredAtEpochMs }) => ({
      effectId: eventId,
      type: step.window.type,
      source: RACE_GAMEPLAY_EFFECT_SOURCES.LUCK_EVENT,
      magnitudeTenths: step.window.tenths,
      startsAtEpochMs: occurredAtEpochMs,
      endsAtEpochMs: occurredAtEpochMs + step.window.durationMs,
    }));

  return {
    activeEffects,
    speedChangeTenths(nowEpochMs) {
      const [effect] = activeEffects(nowEpochMs);
      if (effect == null) return 0;
      return effect.type === RACE_GAMEPLAY_EFFECT_TYPES.SPEED_BOOST ? effect.magnitudeTenths : -effect.magnitudeTenths;
    },
    // The shield is up at the start of every cycle and spent by the block.
    gameplay(nowEpochMs) {
      const events = eventsAt(nowEpochMs);
      const shieldSpent = events.some(({ step }) => step.outcome === RACE_LUCK_OUTCOMES.BLOCKED_BY_SHIELD);
      return {
        powerUps: { guardShieldCharges: shieldSpent ? 0 : 1, guardShieldAwardQuestionId: 1 },
        luck: {
          recentEvents: events.slice(-DEV_LUCK_HISTORY).map(({ eventId, occurredAtEpochMs, step }) => ({
            eventId,
            selectedType: step.appliedType,
            appliedType: step.appliedType,
            outcome: step.outcome,
            occurredAtEpochMs,
          })),
        },
      };
    },
  };
}
