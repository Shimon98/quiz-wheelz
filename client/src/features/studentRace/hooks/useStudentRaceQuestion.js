import { useCallback, useEffect, useRef, useState } from "react";

import { getCurrentQuestion } from "../../../api/racePlayerApi";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { mapCurrentQuestionToModel } from "../runtime/mapCurrentQuestionToModel.js";
import { getQuestionRemainingMs } from "../runtime/questionTiming.js";

/*
 * useStudentRaceQuestion — the student race's question lifecycle owner:
 * request + last-known question + deadline expiry, deliberately SEPARATE
 * from the race runtime (a question refreshes many times per race; none of
 * that belongs next to Pixi-facing state).
 *
 * enabled: the caller passes true only while the race view is authoritative
 * PLAYING — no question requests for waiting/finished/cancelled players.
 *
 * Request model (C1-02K): loading runs in ONE place — the effect below,
 * keyed by enabled + reloadToken. Single-flight is strict: only the LATEST
 * request may clear the in-flight flag (a stale response can never release
 * a newer request's slot), refreshQuestion() reserves the slot immediately
 * so two synchronous callers cannot double-schedule, and a refresh that
 * arrives while a request is running coalesces into exactly ONE trailing
 * refresh (pendingRefreshRef) — so an expiry sync can never be lost, and
 * there is never a request queue or an auto-retry loop.
 *
 * Expiry model: the server's expiresAt/serverTime epoch pair is the deadline
 * truth; scheduling uses the SAME getQuestionRemainingMs formula as the
 * visible timer. One setTimeout per question model fires at the deadline and
 * refreshes ONCE — latched by the question MODEL INSTANCE, which also solves
 * the re-arm case for free: if the server answers "same question, still
 * active" (tiny clock/network skew), the fresh response is a NEW instance
 * with fresh clock calibration, so isExpired clears and a new deadline is
 * armed for the real remaining time — no loop, no permanently locked
 * question. A FAILED expiry refresh keeps the old instance: still expired,
 * still locked, manual retry only. The server decides actual expiry either
 * way (StudentQuestionDeliveryService expires + regenerates on this POST).
 *
 * Errors are normalized only — no navigation here (the page owns the session
 * gate and conflict policy). A failed refresh keeps the last-known question,
 * matching the race-state loader's philosophy.
 */
export default function useStudentRaceQuestion({ enabled }) {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  // The question model whose deadline already fired (state so it re-renders).
  const [expiredQuestion, setExpiredQuestion] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Latest-request-wins + strict single-flight.
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  // One expiry-triggered refresh per question model instance.
  const expiryHandledRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      inFlightRef.current = false;
      pendingRefreshRef.current = false;
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
        // Only the latest request may release the slot; a superseded
        // request must not clear a newer request's in-flight state.
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;

          if (pendingRefreshRef.current) {
            pendingRefreshRef.current = false;
            inFlightRef.current = true;
            setReloadToken((token) => token + 1);
          }
        }
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
      // Coalesce: any number of triggers while busy become ONE trailing
      // refresh — an expiry sync is queued, never lost.
      pendingRefreshRef.current = true;
      return;
    }

    // Reserve immediately so two synchronous callers cannot both schedule.
    inFlightRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !question) {
      return undefined;
    }

    const handleDeadline = () => {
      setExpiredQuestion(question);
      if (expiryHandledRef.current === question) {
        return;
      }
      expiryHandledRef.current = question;
      refreshQuestion();
    };

    // Same formula as the visible timer — the two can never disagree. A
    // fresh server response always carries positive remaining time (the
    // server only returns ACTIVE questions), so this schedules forward;
    // zero only happens for a stale instance and stays latched.
    const remainingMs = getQuestionRemainingMs(question);
    const deadlineTimer = setTimeout(handleDeadline, remainingMs);

    return () => {
      clearTimeout(deadlineTimer);
    };
  }, [enabled, question, refreshQuestion]);

  const isExpired = question != null && expiredQuestion === question;

  return { question, error, isExpired, refreshQuestion };
}
