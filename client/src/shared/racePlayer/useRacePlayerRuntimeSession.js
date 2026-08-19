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
 * Never auto-calls leave. Reconnect-window expiry arrives on two server
 * wire paths: reconnect returns it as an outcome, heartbeat throws it.
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
  const [presenceStopped, setPresenceStopped] = useState(false);

  const operationRef = useRef(OPERATIONS.NONE);
  const pendingReconnectRef = useRef(false);
  const retryTimerRef = useRef(null);
  const initialReconnectStartedRef = useRef(false);
  const mountedRef = useRef(true);
  // Mirrors for event handlers (stale-closure safety).
  const hasResolvedSessionRef = useRef(false);
  const terminalOutcomeRef = useRef(null);
  const presenceStoppedRef = useRef(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Placed first so its cleanup runs first: an in-flight request that
  // settles after unmount must not set state, schedule a retry, or run a
  // trailing reconnect.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      pendingReconnectRef.current = false;
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

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

    if (mountedRef.current && pendingReconnectRef.current) {
      pendingReconnectRef.current = false;
      runReconnectRef.current();
    }
  }, []);

  // One-way: an authoritative final race view (FINISHED/CANCELLED/
  // DISCONNECTED) needs no presence work anymore.
  const stopPresence = useCallback(() => {
    if (presenceStoppedRef.current) {
      return;
    }

    presenceStoppedRef.current = true;
    pendingReconnectRef.current = false;
    clearRetryTimer();
    setPresenceStopped(true);
  }, [clearRetryTimer]);

  const runReconnect = useCallback(() => {
    if (!mountedRef.current || presenceStoppedRef.current) {
      return;
    }

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
        if (!mountedRef.current) {
          return;
        }
        applySessionResolution(mapRacePlayerReconnectToModel(response).outcome);
      } catch (rawError) {
        if (!mountedRef.current) {
          return;
        }

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
        if (!mountedRef.current) {
          return;
        }

        const normalized = normalizeApiError(rawError);
        const failureKind = classifyRuntimeSessionFailure(normalized);

        if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.TERMINAL) {
          applySessionResolution(
            RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
          );
        } else if (failureKind === RUNTIME_SESSION_FAILURE_KINDS.SESSION) {
          setError(normalized);
        } else {
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
      isDocumentVisible &&
      !presenceStopped,
  );

  const handleBrowserOffline = useCallback(() => {
    clearRetryTimer();
    setConnectionState(RACE_PLAYER_CONNECTION_STATES.OFFLINE);
  }, [clearRetryTimer]);

  const handleBrowserOnline = useCallback(() => {
    if (terminalOutcomeRef.current == null && !presenceStoppedRef.current) {
      runReconnect();
    }
  }, [runReconnect]);

  const handleDocumentHidden = useCallback(() => {
    clearRetryTimer();
    setIsDocumentVisible(false);
  }, [clearRetryTimer]);

  const handleDocumentVisible = useCallback(() => {
    setIsDocumentVisible(true);
    if (terminalOutcomeRef.current == null && !presenceStoppedRef.current) {
      runReconnect();
    }
  }, [runReconnect]);

  useBrowserLifecycleEvents({
    onOffline: handleBrowserOffline,
    onOnline: handleBrowserOnline,
    onHidden: handleDocumentHidden,
    onVisible: handleDocumentVisible,
  });

  return {
    connectionState,
    hasResolvedSession,
    terminalOutcome,
    error,
    resyncToken,
    reconnectNow: runReconnect,
    stopPresence,
    isGameplayConnectionReady:
      connectionState === RACE_PLAYER_CONNECTION_STATES.CONNECTED &&
      terminalOutcome == null &&
      isDocumentVisible &&
      !presenceStopped,
  };
}
