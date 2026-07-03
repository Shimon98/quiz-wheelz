import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { joinRace } from "../../../api/racePlayerApi";
import { ROUTES } from "../../../constants/routeConstants";
import { normalizeApiError } from "../../../errors/normalizeApiError";
import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";

/**
 * useJoinRace — submits the single smart join form. A failed join NEVER
 * navigates the child anywhere: the localized error key is exposed for an
 * inline message inside the same form (kids don't chase toasts). Success
 * stores the join response (the waiting page's only data source until the
 * server grows a student room-state endpoint) and moves to the waiting room.
 */
export default function useJoinRace() {
  const navigate = useNavigate();

  const [isJoining, setIsJoining] = useState(false);
  const [joinErrorKey, setJoinErrorKey] = useState(null);

  async function submitJoin({ roomCode, displayName }) {
    setIsJoining(true);
    setJoinErrorKey(null);

    try {
      const joinResponse = await joinRace({ roomCode, displayName });

      sessionStorage.setItem(
        STUDENT_JOIN_STORAGE_KEY,
        JSON.stringify(joinResponse),
      );

      navigate(ROUTES.STUDENT_WAITING);
    } catch (requestError) {
      const { messageKey } = normalizeApiError(requestError);

      setJoinErrorKey(
        messageKey === "general.unexpected" ? "student.joinFailed" : messageKey,
      );
    } finally {
      setIsJoining(false);
    }
  }

  return {
    submitJoin,
    isJoining,
    joinErrorKey,
    clearJoinError: () => setJoinErrorKey(null),
  };
}
