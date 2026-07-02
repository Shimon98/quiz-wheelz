import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getTeacherRaceRoom, startTeacherRace } from "../../../api/teacherApi";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  showApiErrorNotification,
  showSuccessNotification,
} from "../../../shared/notifications/appNotifications";
import { RACE_STATUSES } from "../config/raceStatusConfig";

// Temporary waiting-room polling until SSE / live events are implemented.
const WAITING_ROOM_POLL_MS = 4000;

const POLLABLE_STATUSES = [
  RACE_STATUSES.WAITING_FOR_PLAYERS,
  RACE_STATUSES.READY,
];

/**
 * useTeacherRaceRoom — all race-room logic: loads the room, quietly polls
 * for joining players while the race is still waiting (temporary until SSE),
 * and owns the start-race command. The server decides whether a race may
 * start — the client only asks and shows the outcome.
 */
export default function useTeacherRaceRoom(raceId) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  // Initial load + manual refetches.
  useEffect(() => {
    let isActive = true;

    async function loadRoom() {
      try {
        const roomResponse = await getTeacherRaceRoom(raceId);

        if (isActive) {
          setRoom(roomResponse);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      isActive = false;
    };
  }, [raceId, reloadToken]);

  // Quiet background poll while waiting for players — no spinners, no error
  // toasts (a single failed poll just tries again on the next tick).
  const shouldPoll = POLLABLE_STATUSES.includes(room?.status);

  useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }

    const pollTimer = setInterval(async () => {
      try {
        setRoom(await getTeacherRaceRoom(raceId));
      } catch {
        // ignore — next tick retries; real errors surface on user actions
      }
    }, WAITING_ROOM_POLL_MS);

    return () => clearInterval(pollTimer);
  }, [raceId, shouldPoll]);

  async function startRace() {
    setIsStarting(true);

    try {
      const startResponse = await startTeacherRace(raceId);

      showSuccessNotification({
        title: t("raceRoom.startedTitle"),
        message: t("raceRoom.startedBody"),
      });

      // No live screen yet — stay in the room with the fresh status. When
      // the live route ships, navigating there becomes the natural next
      // step (buildTeacherRaceLivePath already exists).
      setRoom((currentRoom) =>
        currentRoom
          ? { ...currentRoom, status: startResponse?.status ?? currentRoom.status }
          : currentRoom,
      );
      refetch();
    } catch (requestError) {
      showApiErrorNotification(requestError, {
        fallbackKey: "teacher.startRaceFailed",
      });
    } finally {
      setIsStarting(false);
    }
  }

  return { room, isLoading, error, refetch, startRace, isStarting };
}
