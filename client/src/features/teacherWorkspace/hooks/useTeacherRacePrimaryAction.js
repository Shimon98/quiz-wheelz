import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  buildTeacherRaceLivePath,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import { showInfoNotification } from "../../../shared/notifications/appNotifications";
import {
  getRacePrimaryAction,
  RACE_ACTION_KINDS,
} from "../config/raceActionsConfig";

const RACE_PATH_BUILDERS = Object.freeze({
  [RACE_ACTION_KINDS.ROOM]: buildTeacherRaceRoomPath,
  [RACE_ACTION_KINDS.LIVE]: buildTeacherRaceLivePath,
});

export default function useTeacherRacePrimaryAction() {
  const navigate = useNavigate();
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);

  return useCallback(
    (race) => {
      const action = getRacePrimaryAction(race?.status);
      const buildRacePath = RACE_PATH_BUILDERS[action.kind];
      const raceId = race?.raceId ?? race?.id;

      if (buildRacePath && raceId != null) {
        navigate(buildRacePath(raceId));
        return;
      }

      if (action.kind === RACE_ACTION_KINDS.SUMMARY_SOON) {
        showInfoNotification({ message: t("racesPage.summarySoon") });
      }
    },
    [navigate, t],
  );
}
