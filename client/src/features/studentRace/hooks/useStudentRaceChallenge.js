import { useCallback, useEffect, useRef, useState } from "react";

import { chooseChallenge } from "../../../api/racePlayerApi";
import { isRacePlayerReconnectRequiredError, isRacePlayerSessionError } from "../../../errors/errorChecks";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig.js";
import { mapChallengeChoiceResponse } from "../runtime/mapChallengeChoiceResponse.js";
import { getQuestionRemainingMs } from "../runtime/questionTiming.js";
import { selectChallengeOffer } from "../runtime/studentRaceGameplayMode.js";
import {
  STUDENT_RACE_CHALLENGE_PHASE as PHASE,
  STUDENT_RACE_STATE_READ as READ,
} from "../runtime/studentRaceRuntimeConstants.js";

const IDLE_SUBMISSION = Object.freeze({ offerId: null, choice: null, phase: PHASE.IDLE, error: null });
const NO_CHOICES = Object.freeze([]);
const CHOICE_REQUEST = Object.freeze({ timeoutMs: STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs });
const CHECK_REQUEST = Object.freeze({ timeoutMs: STUDENT_RACE_CONFIG.challengeCheckTimeoutMs });

// Session and reconnect failures belong to the session flow. Any other failure
// may hide an accepted choice (a lost response), so fresh race state decides.
function needsFreshRaceState(error) {
  return !isRacePlayerSessionError(error) && !isRacePlayerReconnectRequiredError(error);
}

function resolveOpenChoices(enabled, offer, isExpired, submission) {
  if (!enabled || offer == null || isExpired) return NO_CHOICES;
  if (submission.phase === PHASE.IDLE) return offer.choices;
  // After an unknown outcome only the first choice may go again: the server
  // replays it if it already landed, while another choice would conflict.
  if (submission.phase === PHASE.RETRY_SAME_CHOICE) return [submission.choice];
  return NO_CHOICES;
}

export default function useStudentRaceChallenge({
  gameplay,
  enabled,
  readAuthoritativeRaceState,
  applyAuthoritativeSnapshot,
  beginAuthoritativeMutation,
  endAuthoritativeMutation,
  isMutationCurrent,
}) {
  const offer = selectChallengeOffer(gameplay);
  const offerId = offer?.offerId ?? null;
  const [submission, setSubmission] = useState(IDLE_SUBMISSION);
  const [expiredOfferId, setExpiredOfferId] = useState(null);
  const busyRef = useRef(false);
  const isExpired = offerId != null && expiredOfferId === offerId;
  const active = submission.offerId === offerId ? submission : IDLE_SUBMISSION;
  const openChoices = resolveOpenChoices(enabled, offer, isExpired, active);

  // What the screen shows now, for completions that outlive the render that started them.
  const shownRef = useRef({ enabled, offerId });
  useEffect(() => {
    shownRef.current = { enabled, offerId };
    return () => { shownRef.current = { enabled: false, offerId: null }; };
  }, [enabled, offerId]);

  // The read starts after the failure, so what it shows is the answer; never a replay.
  // Only a read that landed in the race state counts; any other read leaves a manual check.
  const reconcile = useCallback(async ({ offerId: key, choice, error }) => {
    setSubmission({ offerId: key, choice, phase: PHASE.RECONCILING, error });
    try {
      const read = await readAuthoritativeRaceState(CHECK_REQUEST);
      const verified = choice == null ? PHASE.IDLE : PHASE.RETRY_SAME_CHOICE;
      setSubmission({ offerId: key, choice, phase: read === READ.CURRENT ? verified : PHASE.SYNC_FAILED, error });
    } catch (rawError) {
      setSubmission({ offerId: key, choice, phase: PHASE.SYNC_FAILED, error: normalizeApiError(rawError) });
    }
  }, [readAuthoritativeRaceState]);

  const resync = useCallback(async () => {
    if (!enabled || busyRef.current) return;
    busyRef.current = true;
    try {
      await reconcile({ offerId, choice: active.choice, error: active.error });
    } finally {
      busyRef.current = false;
    }
  }, [enabled, offerId, active.choice, active.error, reconcile]);

  useEffect(() => {
    if (!enabled || offer == null || isExpired) return undefined;
    const timeout = setTimeout(() => {
      setExpiredOfferId(offer.offerId);
      resync();
    }, getQuestionRemainingMs(offer));
    return () => clearTimeout(timeout);
  }, [enabled, offer, isExpired, resync]);

  // Resolves to the normalized failure, or null once the server confirmed the choice.
  const sendChoice = useCallback(async (request) => {
    const token = beginAuthoritativeMutation();
    setSubmission({ ...request, phase: PHASE.SUBMITTING, error: null });
    try {
      const snapshot = mapChallengeChoiceResponse(await chooseChallenge(request, CHOICE_REQUEST), request);
      const applied = isMutationCurrent(token) && applyAuthoritativeSnapshot(snapshot, token);
      setSubmission(applied ? { ...request, phase: PHASE.IDLE, error: null } : IDLE_SUBMISSION);
      return null;
    } catch (rawError) {
      return normalizeApiError(rawError);
    } finally {
      endAuthoritativeMutation(token);
    }
  }, [applyAuthoritativeSnapshot, beginAuthoritativeMutation, endAuthoritativeMutation, isMutationCurrent]);

  const choose = useCallback(async (choice) => {
    if (busyRef.current || !openChoices.includes(choice)) return;
    // A background tab can fire the deadline timer late, so the tap checks it too.
    if (getQuestionRemainingMs(offer) <= 0) {
      setExpiredOfferId(offer.offerId);
      resync();
      return;
    }
    busyRef.current = true;
    const request = { offerId: offer.offerId, choice };
    try {
      const failure = await sendChoice(request);
      if (failure == null) return;
      if (!needsFreshRaceState(failure)) {
        setSubmission({ ...request, choice: null, phase: PHASE.IDLE, error: failure });
      } else if (shownRef.current.enabled && shownRef.current.offerId === request.offerId) {
        await reconcile({ ...request, error: failure });
      } else {
        // The screen moved on (newer state, finished race, reconnect or unmount):
        // no late read; if this offer shows again, a manual check waits for it.
        setSubmission({ ...request, phase: PHASE.SYNC_FAILED, error: failure });
      }
    } finally {
      busyRef.current = false;
    }
  }, [offer, openChoices, resync, sendChoice, reconcile]);

  return {
    offer,
    phase: active.phase,
    selectedChoice: active.choice,
    openChoices,
    isExpired,
    error: submission.error,
    choose,
    resync,
  };
}
