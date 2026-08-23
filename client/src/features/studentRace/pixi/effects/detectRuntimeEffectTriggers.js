import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";

function observeRuntime(runtimeState) {
  return {
    activeEffect: runtimeState.visual?.activeEffect ?? null,
    targetSpeed: runtimeState.visual?.targetSpeed ?? null,
    playerFinished: runtimeState.playerFinished ?? null,
  };
}

export function detectRuntimeEffectTriggers(previous, runtimeState) {
  if (runtimeState == null) {
    return { observed: previous, effects: [] };
  }

  const observed = observeRuntime(runtimeState);
  if (previous == null) {
    return { observed, effects: [] };
  }

  const effects = [];
  if (observed.playerFinished === true && previous.playerFinished === false) {
    effects.push(STUDENT_RACE_EFFECT.FINISH);
  }
  if (
    observed.activeEffect != null &&
    observed.activeEffect !== previous.activeEffect
  ) {
    effects.push(observed.activeEffect);
  }
  if (
    previous.targetSpeed != null &&
    observed.targetSpeed != null &&
    observed.targetSpeed > previous.targetSpeed
  ) {
    effects.push(STUDENT_RACE_EFFECT.BOOST);
  }

  return { observed, effects };
}
