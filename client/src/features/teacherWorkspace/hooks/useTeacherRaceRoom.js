import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getTeacherRaceRoom, startTeacherRace } from "../../../api/teacherApi";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { buildTeacherRaceLivePath } from "../../../constants/routeConstants";
import {
  showApiErrorNotification,
  showSuccessNotification,
} from "../../../shared/notifications/appNotifications";
import { RACE_STATUSES } from "../config/raceStatusConfig";

const WAITING_ROOM_POLL_MS = 4000;

const POLLABLE_STATUSES = [
  RACE_STATUSES.WAITING_FOR_PLAYERS,
  RACE_STATUSES.READY,
];

function ignorePollFailure() {}

export default function useTeacherRaceRoom(raceId) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const navigate = useNavigate();

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

  const shouldPoll = POLLABLE_STATUSES.includes(room?.status);

  useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }

    const pollTimer = setInterval(() => {
      getTeacherRaceRoom(raceId).then(setRoom).catch(ignorePollFailure);
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

      navigate(buildTeacherRaceLivePath(startResponse?.raceId ?? raceId), {
        replace: true,
      });
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
