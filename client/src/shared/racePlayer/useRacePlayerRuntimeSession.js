import { useCallback, useEffect, useRef, useState } from "react";

import {
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../api/racePlayerApi";
import { normalizeApiError } from "../../errors/normalizeApiError";
import { RACE_PLAYER_RECONNECT_OUTCOMES } from "../../constants/raceStatusConstants";
import useIntervalWhen from "../hooks/useIntervalWhen";
import useBrowserLifecycleEvents, {
  isBrowserOffline,
  isDocumentHidden,
} from "../hooks/useBrowserLifecycleEvents";
import { mapRacePlayerReconnectToModel } from "./mapRacePlayerReconnectToModel";
import {
  RACE_PLAYER_CONNECTION_STATES,
  RACE_PLAYER_RUNTIME_SESSION_CONFIG,
} from "./racePlayerRuntimeSessionConfig";
import {
  RUNTIME_SESSION_FAILURE_KINDS,
  canScheduleReconnectRetry,
  classifyRuntimeSessionFailure,
  isTerminalReconnectOutcome,
  resolveDegradedConnectionState,
} from "./racePlayerRuntimeSessionPolicy";

/*
 * The RacePlayer runtime-session lifecycle owner (C1-05): reconnect on
 * entry/online/visible/manual, heartbeat while resolved + visible, one
 * retry timer on transient failures. Never calls leave automatically.
 */

const OPERATIONS = Object.freeze({
  NONE: "NONE",
  HEARTBEAT: "HEARTBEAT",
  RECONNECT: "RECONNECT",
});

export default function useRacePlayerRuntimeSession() {
  const [connectionState, setConnectionState] = useState(
    RACE_PLAYER_CONNECTION_STATES.CONNECTING,
  );
  const [hasResolvedSession, setHasResolvedSession] = useState(false);
  const [terminalOutcome, setTerminalOutcome] = useState(null);
  const [error, setError] = useState(null);
  const [resyncToken, setResyncToken] = useState(0);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => !isDocumentHidden(),
  );

  const operationRef = useRef(OPERATIONS.NONE);
  const pendingReconnectRef = useRef(false);
  const retryTimerRef = useRef(null);
  const initialReconnectStartedRef = useRef(false);
  // Mirrors for event handlers (stale-closure safety).
  const hasResolvedSessionRef = useRef(false);
  const terminalOutcomeRef = useRef(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // A server lifecycle resolution (live or terminal) — not a failure.
  const applySessionResolution = useCallback(
    (outcome) => {
      const terminal = isTerminalReconnectOutcome(outcome) ? outcome : null;
      terminalOutcomeRef.current = terminal;
      hasResolvedSessionRef.current = true;
      clearRetryTimer();
      setTerminalOutcome(terminal);
      setHasResolvedSession(true);
      setConnectionState(RACE_PLAYER_CONNECTION_STATES.CONNECTED);
      setError(null);
      setResyncToken((token) => token + 1);
    },
    [clearRetryTimer],
  );

  // Re-entry goes through a ref — a useCallback may not reference itself.
  const runReconnectRef = useRef(null);

  const settleOperation = useCallback(() => {
    operationRef.current = OPERATIONS.NONE;

    if (pendingReconnectRef.current) {
      pendingReconnectRef.current = false;
      runReconnectRef.current();
    }
  }, []);

  const runReconnect = useCallback(() => {
    if (operationRef.current === OPERATIONS.RECONNECT) {
      return;
    }

    if (operationRef.current === OPERATIONS.HEARTBEAT) {
      // One trailing reconnect after the heartbeat settles — never a queue.
      pendingReconnectRef.current = true;
      return;
    }

    operationRef.current = OPERATIONS.RECONNECT;
    clearRetryTimer();

    async function executeReconnect() {
      setConnectionState(
        hasResolvedSessionRef.current
          ? RACE_PLAYER_CONNECTION_STATES.RECONNECTING
          : RACE_PLAYER_CONNECTION_STATES.CONNECTING,
      );

      try {
        const response = await reconnectRacePlayer();
        applySessionResolution(mapRacePlayerReconnectToModel(response).outcome);
      } catch (rawError) {
        const normalized = normalizeApiError(rawError);
        const failureKind = classifyRuntimeSessionFailure(normalized);

        if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.TERMINAL) {
          applySessionResolution(
            RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
          );
          return;
        }

        if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.SESSION) {
          // Dead identity — the gate owns what happens next; no retry.
          setConnectionState(RACE_PLAYER_CONNECTION_STATES.CONNECTED);
          setError(normalized);
          return;
        }

        setConnectionState(resolveDegradedConnectionState(isBrowserOffline()));
        setError(normalized);

        if (
          canScheduleReconnectRetry(failureKind, {
            hidden: isDocumentHidden(),
            offline: isBrowserOffline(),
          })
        ) {
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            runReconnectRef.current();
          }, RACE_PLAYER_RUNTIME_SESSION_CONFIG.reconnectRetryMs);
        }
      } finally {
        settleOperation();
      }
    }

    executeReconnect();
  }, [applySessionResolution, clearRetryTimer, settleOperation]);

  useEffect(() => {
    runReconnectRef.current = runReconnect;
  }, [runReconnect]);

  const runHeartbeat = useCallback(() => {
    if (operationRef.current !== OPERATIONS.NONE) {
      return;
    }

    operationRef.current = OPERATIONS.HEARTBEAT;

    async function executeHeartbeat() {
      try {
        await heartbeatRacePlayer();
      } catch (rawError) {
        const normalized = normalizeApiError(rawError);
        const failureKind = classifyRuntimeSessionFailure(normalized);

        if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.TERMINAL) {
          applySessionResolution(
            RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
          );
        } else if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.SESSION) {
          setError(normalized);
        } else {
          // Recovery belongs to the reconnect command.
          pendingReconnectRef.current = true;
        }
      } finally {
        settleOperation();
      }
    }

    executeHeartbeat();
  }, [applySessionResolution, settleOperation]);

  // Latched — StrictMode must not double-POST the initial reconnect.
  useEffect(() => {
    if (initialReconnectStartedRef.current) {
      return;
    }

    initialReconnectStartedRef.current = true;
    runReconnect();
  }, [runReconnect]);

  useIntervalWhen(
    runHeartbeat,
    RACE_PLAYER_RUNTIME_SESSION_CONFIG.heartbeatIntervalMs,
    hasResolvedSession &&
      connectionState === RACE_PLAYER_CONNECTION_STATES.CONNECTED &&
      terminalOutcome == null &&
      error == null &&
      isDocumentVisible,
  );

  // Local offline is a hint, never server DISCONNECTED; terminal sessions
  // ignore automatic triggers.
  const handleBrowserOffline = useCallback(() => {
    clearRetryTimer();
    setConnectionState(RACE_PLAYER_CONNECTION_STATES.OFFLINE);
  }, [clearRetryTimer]);

  const handleBrowserOnline = useCallback(() => {
    if (terminalOutcomeRef.current == null) {
      runReconnect();
    }
  }, [runReconnect]);

  const handleDocumentHidden = useCallback(() => {
    clearRetryTimer();
    setIsDocumentVisible(false);
  }, [clearRetryTimer]);

  const handleDocumentVisible = useCallback(() => {
    setIsDocumentVisible(true);
    if (terminalOutcomeRef.current == null) {
      runReconnect();
    }
  }, [runReconnect]);

  useBrowserLifecycleEvents({
    onOffline: handleBrowserOffline,
    onOnline: handleBrowserOnline,
    onHidden: handleDocumentHidden,
    onVisible: handleDocumentVisible,
  });

  // Unmount cleans up locally only — never leave.
  useEffect(() => {
    return () => {
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  return {
    connectionState,
    hasResolvedSession,
    terminalOutcome,
    error,
    resyncToken,
    reconnectNow: runReconnect,
    isGameplayConnectionReady:
      connectionState === RACE_PLAYER_CONNECTION_STATES.CONNECTED &&
      terminalOutcome == null,
  };
}
