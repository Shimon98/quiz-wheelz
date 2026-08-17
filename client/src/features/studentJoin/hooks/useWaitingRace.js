import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useRacePlayerState from "../../../shared/racePlayer/useRacePlayerState";
import {
  getRaceView,
  RACE_VIEWS,
} from "../../../shared/racePlayer/getRaceView";
import { ROUTES } from "../../../constants/routeConstants";
import { STUDENT_WAITING_POLL_MS } from "../config/studentJoinConfig";

/*
 * useWaitingRace — the waiting page's orchestration layer. Pure composition:
 *
 *   useRacePlayerState()   request lifecycle (the shared loader — owns
 *                          loading/error/retry/last-known state)
 *           ↓ raceState
 *   getRaceView(snapshot)  authoritative state → client view
 *
 * plus the two waiting-specific behaviors:
 *
 * POLLING (temporary change detection): while the view is WAITING, refetch
 * race-state every STUDENT_WAITING_POLL_MS via the loader's retry(), which
 * is already a no-op while a request is in flight — no concurrent spam. A
 * future SSE "race started" event replaces only this timer trigger; the
 * source of truth (race-state) stays the same.
 *
 * TRANSITION: any view the race page owns (PLAYING/FINISHED/CANCELLED/
 * DISCONNECTED) navigates to /student/race with replace — the status
 * presentations live there once, never duplicated in the waiting flow, and
 * Back never returns to a stale waiting screen. UNKNOWN stays here with a
 * manual retry (no endless polling at a state the client doesn't
 * understand). Session-invalid policy is NOT here — RacePlayerSessionGate
 * owns it at the page boundary.
 */

const RACE_PAGE_VIEWS = new Set([
  RACE_VIEWS.PLAYING,
  RACE_VIEWS.FINISHED,
  RACE_VIEWS.CANCELLED,
  RACE_VIEWS.DISCONNECTED,
]);

export default function useWaitingRace() {
  const navigate = useNavigate();
  const { raceState, isLoading, error, retry } = useRacePlayerState();

  const view = raceState ? getRaceView(raceState.snapshot) : null;

  // Immediate on the very first PLAYING/etc. response — no poll-tick delay.
  const shouldEnterRace = view != null && RACE_PAGE_VIEWS.has(view);

  useEffect(() => {
    if (shouldEnterRace) {
      navigate(ROUTES.STUDENT_RACE, { replace: true });
    }
  }, [shouldEnterRace, navigate]);

  useEffect(() => {
    if (view !== RACE_VIEWS.WAITING) {
      return undefined;
    }

    const timer = setInterval(retry, STUDENT_WAITING_POLL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [view, retry]);

  return { raceState, view, isLoading, error, retry };
}
