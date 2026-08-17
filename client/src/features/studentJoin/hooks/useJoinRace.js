import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { joinRace } from "../../../api/racePlayerApi";
import { ROUTES } from "../../../constants/routeConstants";
import { showApiErrorNotification } from "../../../shared/notifications/appNotifications";
import { STUDENT_JOIN_STORAGE_KEY } from "../config/studentJoinConfig";

/**
 * useJoinRace — submits the single smart join form. A failed join NEVER
 * navigates the child anywhere: the localized error pops as a notification
 * over the SAME form (field validation stays inline at the inputs, and the
 * card never grows to fit an error). Success stores the join response (the
 * waiting page's only data source until the server grows a student
 * room-state endpoint) and moves to the waiting room.
 */
export default function useJoinRace() {
  const navigate = useNavigate();

  const [isJoining, setIsJoining] = useState(false);

  async function submitJoin({ roomCode, displayName }) {
    setIsJoining(true);

    try {
      const joinResponse = await joinRace({ roomCode, displayName });

      sessionStorage.setItem(
        STUDENT_JOIN_STORAGE_KEY,
        JSON.stringify(joinResponse),
      );

      navigate(ROUTES.STUDENT_WAITING);
    } catch (requestError) {
      // A generic "unexpected" reads scary to kids — the join-specific
      // fallback replaces it (fallbackKey applies exactly in that case).
      showApiErrorNotification(requestError, {
        fallbackKey: "student.joinFailed",
      });
    } finally {
      setIsJoining(false);
    }
  }

  return {
    submitJoin,
    isJoining,
  };
}
