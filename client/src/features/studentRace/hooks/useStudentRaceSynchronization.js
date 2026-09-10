import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { isRacePlayerSessionError } from "../../../errors/errorChecks.js";
import { applyRaceSnapshot } from "../runtime/applyRaceSnapshot.js";
import { mergeRaceStateIntoRuntime } from "../runtime/mergeRaceStateIntoRuntime.js";
import { getRaceView, RACE_VIEWS } from "../../../shared/racePlayer/getRaceView.js";
import useStudentRaceEventStream from "./useStudentRaceEventStream.js";
import { requestFinishArbitration as requestArbitration } from "../../../api/studentRaceLiveApi.js";
import { ApiContractError } from "../../../errors/ApiContractError.js";
import { mapStudentRaceFinishArbitration } from "../runtime/mapStudentRaceFinishArbitration.js";
import { mergeStudentRaceFinishOrder } from "../runtime/mergeStudentRaceFinishOrder.js";

const REFRESH_SIGNALS = new Set(["QUESTION_ANSWERED", "PLAYER_FINISHED", "RACE_FINISHED"]);

export default function useStudentRaceSynchronization({ raceState, requestError, silentRefresh, syncEnabled }) {
  const runtimeRef = useRef(null);
  const finishOrderRef = useRef(null);
  const arbitrationRef = useRef(null);
  const generationRef = useRef(0);
  const activeMutationsRef = useRef(new Set());
  const lastObservedStreamVersionRef = useRef(0);
  const pendingRefreshVersionRef = useRef(null);
  const refreshScheduledRef = useRef(false);
  const enabledRef = useRef(syncEnabled);
  const awaitingResyncRef = useRef(false);
  const mountedRef = useRef(true);
  const [runtimeState, setRuntimeState] = useState(null);
  const [finishOrder, setFinishOrder] = useState(null);
  const [error, setError] = useState(null);
  const [streamError, setStreamError] = useState(null);
  const [generation, setGeneration] = useState(0);
  const [awaitingResync, setAwaitingResync] = useState(false);

  const invalidateMutations = useCallback((waitForResync = false) => {
    generationRef.current += 1;
    activeMutationsRef.current.clear();
    arbitrationRef.current = null;
    pendingRefreshVersionRef.current = null;
    refreshScheduledRef.current = false;
    setGeneration(generationRef.current);
    if (waitForResync) {
      awaitingResyncRef.current = true;
      setAwaitingResync(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    enabledRef.current = syncEnabled;
    if (!syncEnabled) invalidateMutations(true);
  }, [syncEnabled, invalidateMutations]);

  const publish = useCallback((next) => {
    if (next !== runtimeRef.current) {
      runtimeRef.current = next;
      setRuntimeState(next);
    }
    lastObservedStreamVersionRef.current = Math.max(lastObservedStreamVersionRef.current, next.lastEventVersion);
    if (pendingRefreshVersionRef.current <= next.lastEventVersion) pendingRefreshVersionRef.current = null;
    setError(null);
  }, []);

  const ingestRaceState = useCallback((response) => {
    if (response == null) return;
    try {
      const previous = runtimeRef.current;
      const next = mergeRaceStateIntoRuntime(previous, response);
      if (previous && (previous.race.id !== next.race.id ||
          previous.player.racePlayerId !== next.player.racePlayerId)) {
        invalidateMutations();
        lastObservedStreamVersionRef.current = 0;
        finishOrderRef.current = null;
        setFinishOrder(null);
      }
      if (enabledRef.current) {
        awaitingResyncRef.current = false;
        setAwaitingResync(false);
      }
      publish(next);
    } catch (rawError) {
      setError(normalizeApiError(rawError));
    }
  }, [publish, invalidateMutations]);

  useEffect(() => {
    let cancelled = false;
    const receivedGeneration = generationRef.current;
    queueMicrotask(() => {
      if (!cancelled && receivedGeneration === generationRef.current) ingestRaceState(raceState);
    });
    return () => { cancelled = true; };
  }, [raceState, ingestRaceState]);

  const flushPendingRefresh = useCallback(() => {
    const applied = runtimeRef.current?.lastEventVersion ?? 0;
    if (pendingRefreshVersionRef.current <= applied) pendingRefreshVersionRef.current = null;
    if (pendingRefreshVersionRef.current == null || refreshScheduledRef.current ||
        activeMutationsRef.current.size > 0 || !enabledRef.current || awaitingResyncRef.current) return;
    refreshScheduledRef.current = true;
    const generationAtSchedule = generationRef.current;
    Promise.resolve().then(async () => {
      if (generationAtSchedule !== generationRef.current || !mountedRef.current) return;
      try {
        if (enabledRef.current && !awaitingResyncRef.current && activeMutationsRef.current.size === 0 &&
            pendingRefreshVersionRef.current > (runtimeRef.current?.lastEventVersion ?? 0)) {
          await silentRefresh();
        }
      } catch (rawError) {
        if (mountedRef.current && generationAtSchedule === generationRef.current) {
          setStreamError(normalizeApiError(rawError));
        }
      } finally {
        if (generationAtSchedule === generationRef.current) refreshScheduledRef.current = false;
      }
    });
  }, [silentRefresh]);

  const requestRefreshForVersion = useCallback((version) => {
    if (version <= (runtimeRef.current?.lastEventVersion ?? 0)) return;
    pendingRefreshVersionRef.current = Math.max(pendingRefreshVersionRef.current ?? 0, version);
    flushPendingRefresh();
  }, [flushPendingRefresh]);

  const observeSignal = useCallback((signal) => {
    const previous = lastObservedStreamVersionRef.current;
    if (signal.version <= previous) return;
    lastObservedStreamVersionRef.current = signal.version;
    if ((previous > 0 && signal.version > previous + 1) || REFRESH_SIGNALS.has(signal.type)) {
      requestRefreshForVersion(signal.version);
    }
  }, [requestRefreshForVersion]);

  const beginAuthoritativeMutation = useCallback(() => {
    const token = { id: Symbol(), generation: generationRef.current };
    activeMutationsRef.current.add(token.id);
    return token;
  }, []);

  const isMutationCurrent = useCallback((token) => mountedRef.current &&
    (token == null || token.generation === generationRef.current), []);

  const applyAuthoritativeSnapshot = useCallback((snapshot, token = null) => {
    if (!isMutationCurrent(token) || runtimeRef.current == null) return false;
    try {
      publish(applyRaceSnapshot(runtimeRef.current, snapshot));
      return true;
    } catch (rawError) {
      setError(normalizeApiError(rawError));
      return false;
    }
  }, [publish, isMutationCurrent]);

  const endAuthoritativeMutation = useCallback((token) => {
    if (!isMutationCurrent(token)) return;
    activeMutationsRef.current.delete(token.id);
    if (activeMutationsRef.current.size === 0) flushPendingRefresh();
  }, [isMutationCurrent, flushPendingRefresh]);

  const prepareAuthoritativeResync = useCallback(() => {
    invalidateMutations(true);
  }, [invalidateMutations]);

  const requestFinishArbitration = useCallback(() => {
    if (arbitrationRef.current) return arbitrationRef.current;
    if (!runtimeRef.current || !enabledRef.current || awaitingResyncRef.current) return Promise.resolve(null);
    const token = beginAuthoritativeMutation();
    const pending = (async () => {
      try {
        const response = await requestArbitration();
        if (!isMutationCurrent(token)) return null;
        const model = mapStudentRaceFinishArbitration(response, runtimeRef.current.player.racePlayerId);
        if (model.raceId !== runtimeRef.current.race.id) {
          throw new ApiContractError("Arbitration race identity changed");
        }
        const proof = mergeStudentRaceFinishOrder(finishOrderRef.current, model.finishOrder);
        applyAuthoritativeSnapshot(model.snapshot, token);
        finishOrderRef.current = proof;
        setFinishOrder(proof);
        return model;
      } catch (rawError) {
        if (isMutationCurrent(token)) setError(normalizeApiError(rawError));
        return null;
      } finally {
        endAuthoritativeMutation(token);
        if (arbitrationRef.current === pending) arbitrationRef.current = null;
      }
    })();
    arbitrationRef.current = pending;
    return pending;
  }, [beginAuthoritativeMutation, endAuthoritativeMutation, isMutationCurrent, applyAuthoritativeSnapshot]);

  useStudentRaceEventStream({
    enabled: syncEnabled && !awaitingResync && getRaceView(runtimeState) === RACE_VIEWS.PLAYING &&
      !isRacePlayerSessionError(requestError ?? error),
    afterVersion: runtimeState?.lastEventVersion ?? 0,
    generation,
    onSignal: observeSignal,
    onError: setStreamError,
  });

  return { runtimeState, finishOrder, requestFinishArbitration, error, streamError, applyAuthoritativeSnapshot,
    beginAuthoritativeMutation, endAuthoritativeMutation, isMutationCurrent,
    prepareAuthoritativeResync, observeSignal };
}
