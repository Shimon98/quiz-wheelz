import { useEffect, useMemo, useRef, useState } from "react";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView.js";
import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants.js";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../config/raceAnimationConfig.js";
import { STUDENT_RACE_FINISH_EXPERIENCE as CONFIG,
  FINISH_EXPERIENCE_PHASES as PHASES } from "../config/finishExperienceConfig.js";

const DURATION = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;
const initial = (identity, playing) => ({ identity, observedPlaying: playing,
  approaching: false, released: [], complete: false });

export default function useStudentRaceFinishExperience({
  runtimeState, view, finishOrder, finishSyncEnabled, requestFinishArbitration,
}) {
  const identity = `${runtimeState?.race?.id}:${runtimeState?.player?.racePlayerId}`;
  const [tracked, setTracked] = useState(() => initial(identity, view === RACE_VIEWS.PLAYING));
  const state = tracked.identity === identity ? tracked : initial(identity, view === RACE_VIEWS.PLAYING);
  if (tracked.identity !== identity) setTracked(state);
  else if (view === RACE_VIEWS.PLAYING && !tracked.observedPlaying) {
    setTracked({ ...tracked, observedPlaying: true });
  }
  const scheduledIds = useRef(new Set());
  const releaseTimers = useRef(new Set());
  const nextReleaseAt = useRef(0);
  const confirmed = finishOrder?.confirmedFinishers ?? [];
  const ownId = runtimeState?.player?.racePlayerId;
  const ownConfirmed = confirmed.some((player) => player.racePlayerId === ownId);
  const ownCrossingReleased = state.released.includes(ownId);
  const liveFinished = view === RACE_VIEWS.FINISHED && state.observedPlaying &&
    (runtimeState?.playerFinished === true || runtimeState?.playerStatus === RACE_PLAYER_STATUSES.FINISHED);
  const active = view === RACE_VIEWS.PLAYING || liveFinished;
  const opponentNeedsProof = runtimeState?.opponents?.some((opponent) =>
    opponent.status === RACE_PLAYER_STATUSES.FINISHED &&
    !confirmed.some((player) => player.racePlayerId === opponent.racePlayerId));
  const needsArbitration = active && !state.complete &&
    (((state.approaching || liveFinished) && !ownConfirmed) || opponentNeedsProof);

  useEffect(() => {
    const timers = releaseTimers.current;
    scheduledIds.current.clear();
    nextReleaseAt.current = 0;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [identity]);

  const position = runtimeState?.player?.position;
  const totalDistance = runtimeState?.totalDistance;
  const rate = runtimeState?.visual?.movementUnitsPerSecond ?? 0;
  useEffect(() => {
    if (view !== RACE_VIEWS.PLAYING || !finishSyncEnabled || state.approaching || ownConfirmed || rate <= 0) return;
    const eta = Math.max(0, totalDistance - position) / rate * 1000;
    if (!Number.isFinite(eta)) return;
    const timer = setTimeout(() => {
      setTracked((previous) => previous.identity === identity ? { ...previous, approaching: true } : previous);
    }, Math.max(0, eta - CONFIG.arbitrationLeadMs));
    return () => clearTimeout(timer);
  }, [identity, view, position, totalDistance, rate, finishSyncEnabled, state.approaching, ownConfirmed]);

  useEffect(() => {
    if (!finishSyncEnabled || !needsArbitration) return;
    let cancelled = false;
    let timer;
    async function request() {
      try {
        await requestFinishArbitration();
      } finally {
        if (!cancelled) timer = setTimeout(request, CONFIG.arbitrationRetryMs);
      }
    }
    void request();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [identity, finishSyncEnabled, needsArbitration, requestFinishArbitration]);

  useEffect(() => {
    if (!active || !finishOrder) return;
    const groups = [];
    for (const finisher of finishOrder.confirmedFinishers) {
      if (scheduledIds.current.has(finisher.racePlayerId)) continue;
      scheduledIds.current.add(finisher.racePlayerId);
      const last = groups.at(-1);
      if (last?.time === finisher.finishedAtEpochMs) last.ids.push(finisher.racePlayerId);
      else groups.push({ time: finisher.finishedAtEpochMs, ids: [finisher.racePlayerId] });
    }
    const now = Date.now();
    for (const group of groups) {
      const releaseAt = Math.max(now, nextReleaseAt.current);
      nextReleaseAt.current = releaseAt + CONFIG.releaseGapMs;
      const timer = setTimeout(() => {
        releaseTimers.current.delete(timer);
        setTracked((previous) => previous.identity === identity
          ? { ...previous, released: [...previous.released, ...group.ids] } : previous);
      }, releaseAt - now);
      releaseTimers.current.add(timer);
    }
  }, [identity, active, finishOrder]);

  useEffect(() => {
    if (!ownCrossingReleased || state.complete) return;
    const timer = setTimeout(() => {
      setTracked((previous) => previous.identity === identity ? { ...previous, complete: true } : previous);
    }, DURATION);
    return () => clearTimeout(timer);
  }, [identity, ownCrossingReleased, state.complete]);

  const phase = state.complete ? PHASES.COMPLETE : ownCrossingReleased ? PHASES.PRESENTING
    : liveFinished ? PHASES.AWAITING_AUTHORITY : state.approaching ? PHASES.APPROACHING : PHASES.RACING;
  const presentation = useMemo(() => ({ active, ownCrossingReleased,
    releasedFinisherIds: state.released, visualHoldUnits: CONFIG.visualHoldUnits,
    slowdownDistanceUnits: CONFIG.slowdownDistanceUnits, runoutUnits: CONFIG.runoutUnits,
    runoutDurationMs: DURATION }), [active, ownCrossingReleased, state.released]);
  return { phase, keepRaceScreen: view === RACE_VIEWS.PLAYING || (liveFinished && !state.complete),
    awaitingAuthority: phase === PHASES.AWAITING_AUTHORITY, presentationComplete: state.complete, presentation };
}
