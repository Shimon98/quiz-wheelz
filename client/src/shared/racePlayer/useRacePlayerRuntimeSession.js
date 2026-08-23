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
  const hasResolvedSessionRef = useRef(false);
  const terminalOutcomeRef = useRef(null);
  const presenceStoppedRef = useRef(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current != null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

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

  const runReconnectRef = useRef(null);

  const settleOperation = useCallback(() => {
    operationRef.current = OPERATIONS.NONE;

    if (mountedRef.current && pendingReconnectRef.current) {
      pendingReconnectRef.current = false;
      if (!isDocumentHidden()) {
        runReconnectRef.current();
      }
    }
  }, []);

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
    if (
      !mountedRef.current ||
      presenceStoppedRef.current ||
      isDocumentHidden()
    ) {
      return;
    }

    if (operationRef.current === OPERATIONS.RECONNECT) {
      return;
    }

    setConnectionState(
      hasResolvedSessionRef.current
        ? RACE_PLAYER_CONNECTION_STATES.RECONNECTING
        : RACE_PLAYER_CONNECTION_STATES.CONNECTING,
    );

    if (operationRef.current === OPERATIONS.HEARTBEAT) {
      pendingReconnectRef.current = true;
      return;
    }

    operationRef.current = OPERATIONS.RECONNECT;
    clearRetryTimer();

    async function executeReconnect() {
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
    if (isDocumentHidden()) {
      return;
    }

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
      setConnectionState(RACE_PLAYER_CONNECTION_STATES.RECONNECTING);
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
      hasResolvedSession &&
      error == null &&
      connectionState === RACE_PLAYER_CONNECTION_STATES.CONNECTED &&
      terminalOutcome == null &&
      isDocumentVisible &&
      !presenceStopped,
  };
}
