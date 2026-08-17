import { useCallback, useEffect, useRef, useState } from "react";

import { getCurrentQuestion } from "../../../api/racePlayerApi";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { mapCurrentQuestionToModel } from "../runtime/mapCurrentQuestionToModel.js";

/*
 * useStudentRaceQuestion — the student race's question lifecycle owner:
 * request + last-known question + deadline expiry, deliberately SEPARATE
 * from the race runtime (a question refreshes many times per race; none of
 * that belongs next to Pixi-facing state).
 *
 * enabled: the caller passes true only while the race view is authoritative
 * PLAYING — no question requests for waiting/finished/cancelled players.
 *
 * Loading runs in ONE place — the effect below, keyed by enabled +
 * reloadToken (the project's single-fetch-path pattern, see
 * useRacePlayerState). refreshQuestion() bumps the token from event/timeout
 * handlers and no-ops while a request is in flight, so retry, expiry sync
 * and C1-03's post-answer refresh all share one request path.
 *
 * Expiry model: the server's expiresAt is the deadline truth. One setTimeout
 * per question fires at that instant and refreshes ONCE (latched by question
 * id + deadline, so a same-still-expired response or a failed refresh can
 * never loop). The server marks the old question EXPIRED and generates the
 * next one on this exact GET (StudentQuestionDeliveryService) — no invented
 * expiry protocol. isExpired is DERIVED (fired key === current key), so a
 * new question resets it with no extra state juggling. Per-second countdown
 * display lives in the timer component, not here, so the page doesn't
 * re-render on every tick.
 *
 * Errors are normalized only — no navigation here (the page owns the session
 * gate and conflict policy). A failed refresh keeps the last-known question,
 * matching the race-state loader's philosophy.
 */

function getExpiryKey(question) {
  return question ? `${question.id}:${question.expiresAtMs}` : null;
}

export default function useStudentRaceQuestion({ enabled }) {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  // The expiry key whose deadline already fired (state so it re-renders).
  const [firedExpiryKey, setFiredExpiryKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Latest-request-wins + single-flight, same pattern as useRacePlayerState.
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  // One expiry-triggered refresh per question+deadline.
  const expiryHandledRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    inFlightRef.current = true;

    async function loadQuestion() {
      try {
        const response = await getCurrentQuestion();
        const model = mapCurrentQuestionToModel(response);

        if (requestId === requestIdRef.current) {
          setQuestion(model);
          setError(null);
        }
      } catch (rawError) {
        if (requestId === requestIdRef.current) {
          // Keep the last successful question — report the failure only.
          setError(normalizeApiError(rawError));
        }
      } finally {
        inFlightRef.current = false;
      }
    }

    loadQuestion();

    return () => {
      // Abandon any in-flight request on disable/refresh/unmount.
      requestIdRef.current += 1;
    };
  }, [enabled, reloadToken]);

  const refreshQuestion = useCallback(() => {
    if (inFlightRef.current) {
      return;
    }
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !question) {
      return undefined;
    }

    const expiryKey = getExpiryKey(question);

    const handleDeadline = () => {
      setFiredExpiryKey(expiryKey);
      if (expiryHandledRef.current === expiryKey) {
        return;
      }
      expiryHandledRef.current = expiryKey;
      refreshQuestion();
    };

    // An already-passed deadline (refresh onto an old question) fires on a
    // zero timeout — the latch still guarantees a single sync request.
    const remainingMs = Math.max(0, question.expiresAtMs - Date.now());
    const deadlineTimer = setTimeout(handleDeadline, remainingMs);

    return () => {
      clearTimeout(deadlineTimer);
    };
  }, [enabled, question, refreshQuestion]);

  const isExpired =
    question != null && firedExpiryKey === getExpiryKey(question);

  return { question, error, isExpired, refreshQuestion };
}
